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
    const reqUrl = new URL(req.url);

    const supabaseUrl = ((Deno.env.get("SUPABASE_URL") || reqUrl.origin) as string).trim();
    const supabaseServiceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
    const clientId = (Deno.env.get("TWITCH_CLIENT_ID") || "").trim();
    const clientSecret = (Deno.env.get("TWITCH_CLIENT_SECRET") || "").trim();

    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: "Backend is missing SUPABASE_URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Backend is missing SUPABASE_SERVICE_ROLE_KEY (required to save Twitch connection).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Twitch API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = reqUrl;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Support both URL params (for OAuth callback) and JSON body (for API calls)
    let action = url.searchParams.get("action");
    let bodyData: Record<string, unknown> = {};
    
    // If action not in URL, try to parse from body
    if (!action && req.method === "POST") {
      try {
        bodyData = await req.json();
        action = bodyData.action as string;
      } catch {
        // No body or invalid JSON
      }
    }

    console.log("twitch-channel-points action:", action, "method:", req.method);

    if (action === "authorize") {
      // Generate authorization URL for Twitch OAuth
      const functionUrl = `${supabaseUrl}/functions/v1/twitch-channel-points`;
      const redirectUri = `${functionUrl}?action=callback`;
      const frontendUrl = req.headers.get("origin") || "http://localhost:8080";
      const scopes = ["channel:read:redemptions", "user:read:email"].join(" ");
      
      // Get state from body (user_id)
      const userId = (bodyData.state as string) || "";
      
      // Encode state with frontend URL for redirect back
      const stateData = btoa(JSON.stringify({ frontend_url: frontendUrl, user_id: userId }));
      
      const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${stateData}`;

      console.log("Twitch authorize URL generated:", authUrl);
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "callback") {
      // Handle Twitch OAuth callback (GET request from Twitch)
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      // Decode frontend URL and user_id from state
      let frontendUrl = "http://localhost:8080";
      let userId = "";
      try {
        if (state) {
          const stateData = JSON.parse(atob(state));
          frontendUrl = stateData.frontend_url || frontendUrl;
          userId = stateData.user_id || "";
        }
      } catch (e) {
        console.error("Failed to parse state:", e);
      }

      console.log("Callback received, frontend_url:", frontendUrl, "userId:", userId);

      if (error) {
        console.error("Twitch OAuth error:", error, errorDescription);
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?twitch_error=${encodeURIComponent(errorDescription || error)}` },
        });
      }

      if (!code) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?twitch_error=no_code` },
        });
      }

      // Use the same redirect URI that was used in authorization
      const redirectUri = `${supabaseUrl}/functions/v1/twitch-channel-points?action=callback`;
      
      console.log("Exchanging code for token...", { redirectUri });
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
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?twitch_error=token_exchange_failed` },
        });
      }

      const tokens = await tokenResponse.json();
      console.log("Token obtained successfully");

      // Get user info from Twitch
      const userResponse = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`,
          "Client-Id": clientId,
        },
      });

      if (!userResponse.ok) {
        console.error("Failed to get Twitch user info");
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?twitch_error=user_fetch_failed` },
        });
      }

      const userData = await userResponse.json();
      const twitchUser = userData.data[0];
      
      if (!twitchUser) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?twitch_error=no_user_data` },
        });
      }

      console.log("Twitch user:", twitchUser.login);

      // If we have a user_id, save the connection
      if (userId) {
        // Store or update connection
        const { error: upsertError } = await supabase
          .from("user_channel_points")
          .upsert({
            user_id: userId,
            platform: "twitch",
            platform_user_id: twitchUser.id,
            platform_username: twitchUser.login,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            last_synced_at: new Date().toISOString(),
            points_balance: 0,
          }, {
            onConflict: "user_id,platform",
          });

        if (upsertError) {
          console.error("Failed to save Twitch connection:", upsertError);
        } else {
          console.log("Twitch connection saved successfully");
        }

        // Update profile with Twitch username
        await supabase
          .from("profiles")
          .update({ twitch_username: twitchUser.login })
          .eq("user_id", userId);
      }

      return new Response(null, {
        status: 302,
        headers: { 
          Location: `${frontendUrl}/profile?twitch_username=${encodeURIComponent(twitchUser.login)}&twitch_success=true` 
        },
      });
    }

    if (action === "update_points") {
      // Endpoint for updating points from EventSub webhook or admin
      const platform_user_id = bodyData.platform_user_id as string;
      const points = bodyData.points as number;
      
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
