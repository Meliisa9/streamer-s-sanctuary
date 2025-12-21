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
    const url = new URL(req.url);
    
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

    const KICK_CLIENT_ID = (Deno.env.get("KICK_CLIENT_ID") || "").trim();
    const KICK_CLIENT_SECRET = (Deno.env.get("KICK_CLIENT_SECRET") || "").trim();

    const reqOrigin = new URL(req.url).origin;
    const SUPABASE_URL = ((Deno.env.get("SUPABASE_URL") || reqOrigin) as string).trim();
    const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

    console.log("kick-oauth action:", action, "method:", req.method);

    if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          error: "Kick OAuth not configured (missing client id/secret). Please verify your backend secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "authorize") {
      // Get frontend URL from body or query params
      const frontendUrl = (bodyData.frontend_url as string) || 
                          url.searchParams.get("frontend_url") || 
                          req.headers.get("origin") ||
                          "http://localhost:8080";
      const state = (bodyData.state as string) || url.searchParams.get("state") || "";

      // Use the function's origin as the callback base (works locally + in production)
      const functionUrl = `${SUPABASE_URL}/functions/v1/kick-oauth`;
      const callbackUrl = `${functionUrl}?action=callback`;

      console.log("Kick authorize", { frontendUrl, callbackUrl, state });

      // Encode frontend URL and user state for redirect back after OAuth
      const stateData = btoa(JSON.stringify({ frontend_url: frontendUrl, user_id: state }));

      const kickAuthUrl = new URL("https://id.kick.com/oauth/authorize");
      kickAuthUrl.searchParams.set("client_id", KICK_CLIENT_ID);
      kickAuthUrl.searchParams.set("redirect_uri", callbackUrl);
      kickAuthUrl.searchParams.set("response_type", "code");
      kickAuthUrl.searchParams.set("scope", "user:read");
      kickAuthUrl.searchParams.set("state", stateData);

      const authorizeUrl = kickAuthUrl.toString();

      console.log("Kick authorize URL generated:", authorizeUrl);
      return new Response(
        JSON.stringify({ authUrl: authorizeUrl, authorize_url: authorizeUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "callback") {
      // Handle Kick OAuth callback (GET request from Kick)
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

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
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?kick_error=${encodeURIComponent(error)}` },
        });
      }

      if (!code) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?kick_error=no_code` },
        });
      }

      // Use the same callback URL that was used in authorization
      const callbackUrl = `${SUPABASE_URL}/functions/v1/kick-oauth?action=callback`;

      // Exchange code for token
      console.log("Exchanging code for token...", { callbackUrl });
      const tokenResponse = await fetch("https://id.kick.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: KICK_CLIENT_ID,
          client_secret: KICK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: callbackUrl,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?kick_error=token_exchange_failed` },
        });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      const expiresIn = tokenData.expires_in || 3600;
      console.log("Token obtained successfully");

      // Get Kick user info
      const userResponse = await fetch("https://api.kick.com/public/v1/users", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userResponse.ok) {
        const userErrorText = await userResponse.text();
        console.error("Failed to get user info:", userErrorText);
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?kick_error=user_fetch_failed` },
        });
      }

      const userData = await userResponse.json();
      console.log("User data received:", JSON.stringify(userData));
      
      const kickUser = userData.data?.[0] || userData;
      const kickUsername = kickUser.username;
      const kickUserId = kickUser.user_id || kickUser.id;

      if (!kickUsername) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?kick_error=no_username` },
        });
      }

      // If we have a user_id, save the connection to the database
      if (userId) {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
          console.error("Missing backend env for saving Kick connection", {
            hasUrl: !!SUPABASE_URL,
            hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
          });
          return new Response(null, {
            status: 302,
            headers: { Location: `${frontendUrl}/profile?kick_error=backend_not_configured` },
          });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Store or update Kick connection in user_channel_points
        const { error: upsertError } = await supabase
          .from("user_channel_points")
          .upsert(
            {
              user_id: userId,
              platform: "kick",
              platform_user_id: kickUserId?.toString() || kickUsername,
              platform_username: kickUsername,
              access_token: accessToken,
              refresh_token: refreshToken,
              token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
              last_synced_at: new Date().toISOString(),
              points_balance: 0,
            },
            {
              onConflict: "user_id,platform",
            }
          );

        if (upsertError) {
          console.error("Failed to save Kick connection:", upsertError);
          return new Response(null, {
            status: 302,
            headers: { Location: `${frontendUrl}/profile?kick_error=save_failed` },
          });
        }

        // Update profile with Kick username
        await supabase.from("profiles").update({ kick_username: kickUsername }).eq("user_id", userId);

        console.log("Kick connection saved successfully");
      }

      console.log("Kick username:", kickUsername);
      return new Response(null, {
        status: 302,
        headers: { 
          Location: `${frontendUrl}/profile?kick_username=${encodeURIComponent(kickUsername)}&kick_success=true` 
        },
      });
    }

    if (action === "link") {
      // Alternative: Link Kick account for authenticated user
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { kick_username, user_id } = bodyData;

      if (!kick_username || !user_id) {
        return new Response(
          JSON.stringify({ error: "Missing kick_username or user_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ kick_username })
        .eq("user_id", user_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, kick_username }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
