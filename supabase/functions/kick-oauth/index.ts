import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const KICK_CLIENT_ID = (Deno.env.get("KICK_CLIENT_ID") || "").trim();
    const KICK_CLIENT_SECRET = (Deno.env.get("KICK_CLIENT_SECRET") || "").trim();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KICK_CLIENT_ID || !KICK_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          error:
            "Kick OAuth not configured (missing client id/secret). Please verify your backend secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get redirect URL from request or use default
    const redirectBase = url.searchParams.get("redirect_url") || url.origin;

    if (action === "authorize") {
      // Step 1: Generate Kick authorize URL
      const frontendUrl = url.searchParams.get("frontend_url") || "http://localhost:8080";

      // IMPORTANT: Kick must be able to redirect back to this URL.
      // localhost is not reachable from Kick, so for local dev you must use an HTTPS tunnel.
      const callbackBaseRaw = (url.searchParams.get("callback_base") || SUPABASE_URL || "").trim();
      if (!callbackBaseRaw) {
        return new Response(
          JSON.stringify({
            error:
              "Missing callback_base. Provide a public HTTPS base URL (use an ngrok/Cloudflare tunnel for local dev).",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let callbackBase: URL;
      try {
        callbackBase = new URL(callbackBaseRaw);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid callback_base URL." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (callbackBase.protocol !== "https:") {
        return new Response(
          JSON.stringify({ error: "callback_base must be https://" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (/localhost|127\.0\.0\.1/.test(callbackBase.hostname)) {
        return new Response(
          JSON.stringify({
            error:
              "Kick OAuth cannot redirect to localhost. Use an HTTPS tunnel URL as callback_base.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Always normalize to origin (users sometimes paste a full path).
      const callbackUrl = `${callbackBase.origin}/functions/v1/kick-oauth?action=callback`;

      // Encode frontend URL in state so we can redirect back after OAuth
      const state = btoa(JSON.stringify({ frontend_url: frontendUrl }));

      const kickAuthUrl = new URL("https://id.kick.com/oauth/authorize");
      kickAuthUrl.searchParams.set("client_id", KICK_CLIENT_ID);
      kickAuthUrl.searchParams.set("redirect_uri", callbackUrl);
      kickAuthUrl.searchParams.set("response_type", "code");
      kickAuthUrl.searchParams.set("scope", "user:read");
      kickAuthUrl.searchParams.set("state", state);

      const authorizeUrl = kickAuthUrl.toString();

      console.log("Authorize URL generated:", authorizeUrl);
      return new Response(
        JSON.stringify({ authorize_url: authorizeUrl, state, callback_url: callbackUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "callback") {
      // Step 2: Handle Kick OAuth callback
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      // Decode frontend URL from state
      let frontendUrl = "http://localhost:8080";
      try {
        if (state) {
          const stateData = JSON.parse(atob(state));
          frontendUrl = stateData.frontend_url || frontendUrl;
        }
      } catch (e) {
        console.error("Failed to parse state:", e);
      }

      console.log("Callback received, frontend_url:", frontendUrl);

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

      // IMPORTANT: redirect_uri must match what was used in the authorize step.
      // Using url.origin ensures the token exchange matches the actual callback host.
      const callbackUrl = `${url.origin}/functions/v1/kick-oauth?action=callback`;

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
      const kickUsername = userData.data?.[0]?.username || userData.username;

      if (!kickUsername) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/profile?kick_error=no_username` },
        });
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

      const { kick_username, user_id } = await req.json();

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
