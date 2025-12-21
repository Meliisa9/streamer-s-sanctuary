import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to get channel settings from site_settings
async function getChannelSettings(supabase: any) {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["twitch_channel", "kick_channel"]);

  if (error) {
    console.error("Error fetching channel settings:", error);
    return { twitchChannel: null, kickChannel: null };
  }

  const settings: Record<string, string> = {};
  data?.forEach((row: any) => {
    settings[row.key] = row.value;
  });

  return {
    twitchChannel: settings.twitch_channel || null,
    kickChannel: settings.kick_channel || null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Service client for reading site_settings (which may have restricted access)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, platform } = await req.json();

    // Get channel settings for context
    const channelSettings = await getChannelSettings(supabaseService);
    console.log("Channel settings:", channelSettings);

    if (action === "get_all_points") {
      // Get all channel points for the user
      const { data: channelPoints, error } = await supabase
        .from("user_channel_points")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // Get site points from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        points: {
          site: profile?.points || 0,
          twitch: channelPoints?.find(p => p.platform === "twitch")?.points_balance || 0,
          kick: channelPoints?.find(p => p.platform === "kick")?.points_balance || 0,
        },
        connections: channelPoints?.map(p => ({
          platform: p.platform,
          username: p.platform_username,
          connected: !!p.platform_user_id,
          lastSynced: p.last_synced_at,
        })) || [],
        channelSettings: {
          twitchChannel: channelSettings.twitchChannel,
          kickChannel: channelSettings.kickChannel,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync" && platform) {
      // Get current connection
      const { data: connection, error: connError } = await supabase
        .from("user_channel_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .single();

      if (connError || !connection) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `No ${platform} connection found. Please connect your account first.` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let newBalance = connection.points_balance;
      let syncSuccess = false;
      let errorMessage = null;

      if (platform === "twitch") {
        // Sync Twitch channel points using the configured channel
        const result = await syncTwitchPoints(
          connection, 
          supabaseService, 
          user.id, 
          channelSettings.twitchChannel
        );
        if (result.success) {
          newBalance = result.balance;
          syncSuccess = true;
        } else {
          errorMessage = result.error;
        }
      } else if (platform === "kick") {
        // Sync Kick points using the configured channel
        const result = await syncKickPoints(
          connection, 
          supabaseService, 
          user.id, 
          channelSettings.kickChannel
        );
        if (result.success) {
          newBalance = result.balance;
          syncSuccess = true;
        } else {
          errorMessage = result.error;
        }
      }

      if (!syncSuccess) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: errorMessage || "Failed to sync points" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        platform,
        balance: newBalance,
        lastSynced: new Date().toISOString(),
        channel: platform === "twitch" ? channelSettings.twitchChannel : channelSettings.kickChannel,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect" && platform) {
      const { error } = await supabase
        .from("user_channel_points")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", platform);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_channel_settings") {
      return new Response(JSON.stringify({
        success: true,
        channelSettings,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in channel-points-sync:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function syncTwitchPoints(
  connection: any, 
  supabase: any, 
  userId: string, 
  channelName: string | null
) {
  try {
    const clientId = Deno.env.get("TWITCH_CLIENT_ID");
    const clientSecret = Deno.env.get("TWITCH_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      return { success: false, error: "Twitch API not configured" };
    }

    if (!channelName) {
      return { success: false, error: "Twitch channel not configured in Stream Config" };
    }

    console.log(`Syncing Twitch points for user ${userId} on channel ${channelName}`);

    let accessToken = connection.access_token;
    
    // Check if token needs refresh
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      const refreshResult = await refreshTwitchToken(connection.refresh_token, clientId, clientSecret);
      if (!refreshResult.success) {
        return { success: false, error: "Failed to refresh Twitch token. Please reconnect." };
      }
      accessToken = refreshResult.accessToken;
      
      // Update tokens in database
      await supabase
        .from("user_channel_points")
        .update({
          access_token: refreshResult.accessToken,
          refresh_token: refreshResult.refreshToken,
          token_expires_at: new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString(),
        })
        .eq("user_id", userId)
        .eq("platform", "twitch");
    }

    // Note: Twitch doesn't have a direct API for channel points balance for viewers
    // The points need to be synced via EventSub webhooks or broadcaster-initiated updates
    // For now, we update the last synced time and return the current balance
    
    const oldBalance = connection.points_balance;
    
    // Update last synced time with channel info
    await supabase
      .from("user_channel_points")
      .update({ 
        last_synced_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("platform", "twitch");

    return { success: true, balance: oldBalance, channel: channelName };
  } catch (error: unknown) {
    console.error("Error syncing Twitch points:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

async function refreshTwitchToken(refreshToken: string, clientId: string, clientSecret: string) {
  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch {
    return { success: false };
  }
}

async function syncKickPoints(
  connection: any, 
  supabase: any, 
  userId: string, 
  channelName: string | null
) {
  try {
    if (!channelName) {
      return { success: false, error: "Kick channel not configured in Stream Config" };
    }

    console.log(`Syncing Kick points for user ${userId} on channel ${channelName}`);

    // Kick doesn't have a public API for channel points
    // Points would need to be synced manually or via webhooks when available
    
    const oldBalance = connection.points_balance;
    
    // Update last synced time
    await supabase
      .from("user_channel_points")
      .update({ 
        last_synced_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("platform", "kick");

    return { success: true, balance: oldBalance, channel: channelName };
  } catch (error: unknown) {
    console.error("Error syncing Kick points:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
