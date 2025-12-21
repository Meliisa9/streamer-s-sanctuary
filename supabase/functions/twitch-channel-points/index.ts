import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("TWITCH_CLIENT_ID");
    const clientSecret = Deno.env.get("TWITCH_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Twitch API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, code, state, user_id } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "authorize") {
      // Generate authorization URL for Twitch OAuth
      const redirectUri = `${req.headers.get("origin")}/auth/twitch/callback`;
      const scopes = ["channel:read:redemptions", "user:read:email"].join(" ");
      
      const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${state || ""}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "callback") {
      // Exchange code for tokens
      const redirectUri = `${req.headers.get("origin")}/auth/twitch/callback`;
      
      const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        return new Response(JSON.stringify({ error: "Failed to exchange code for token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();

      // Get user info from Twitch
      const userResponse = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`,
          "Client-Id": clientId,
        },
      });

      if (!userResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to get Twitch user info" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userData = await userResponse.json();
      const twitchUser = userData.data[0];

      if (!user_id) {
        return new Response(JSON.stringify({ error: "User ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store or update connection
      const { error: upsertError } = await supabase
        .from("user_channel_points")
        .upsert({
          user_id,
          platform: "twitch",
          platform_user_id: twitchUser.id,
          platform_username: twitchUser.login,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          last_synced_at: new Date().toISOString(),
          points_balance: 0, // Will be updated via EventSub or manual sync
        }, {
          onConflict: "user_id,platform",
        });

      if (upsertError) {
        console.error("Failed to save Twitch connection:", upsertError);
        return new Response(JSON.stringify({ error: "Failed to save connection" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile with Twitch username
      await supabase
        .from("profiles")
        .update({ twitch_username: twitchUser.login })
        .eq("user_id", user_id);

      return new Response(JSON.stringify({
        success: true,
        username: twitchUser.login,
        displayName: twitchUser.display_name,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_points") {
      // Endpoint for updating points from EventSub webhook or admin
      const { platform_user_id, points } = await req.json();
      
      if (!platform_user_id || points === undefined) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the connection
      const { data: connection, error: connError } = await supabase
        .from("user_channel_points")
        .select("*")
        .eq("platform", "twitch")
        .eq("platform_user_id", platform_user_id)
        .single();

      if (connError || !connection) {
        return new Response(JSON.stringify({ error: "Connection not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const oldBalance = connection.points_balance;
      const newBalance = points;
      const diff = newBalance - oldBalance;

      // Update points
      await supabase
        .from("user_channel_points")
        .update({
          points_balance: newBalance,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", connection.id);

      // Log transaction
      await supabase
        .from("channel_point_transactions")
        .insert({
          user_id: connection.user_id,
          platform: "twitch",
          transaction_type: "sync",
          amount: diff,
          balance_before: oldBalance,
          balance_after: newBalance,
          description: "Points synced from Twitch",
        });

      return new Response(JSON.stringify({ success: true, balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in twitch-channel-points:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
