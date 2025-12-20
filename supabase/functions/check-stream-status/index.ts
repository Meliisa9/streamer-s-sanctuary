import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking stream status...");

    // Fetch auto-detection settings
    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["auto_detect_enabled", "twitch_channel", "kick_channel"]);

    if (settingsError) {
      throw new Error(`Failed to fetch settings: ${settingsError.message}`);
    }

    const settingsMap: Record<string, any> = {};
    settings?.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    if (!settingsMap.auto_detect_enabled) {
      console.log("Auto-detection is disabled");
      return new Response(
        JSON.stringify({ message: "Auto-detection is disabled", is_live: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twitchChannel = settingsMap.twitch_channel;
    const kickChannel = settingsMap.kick_channel;

    let isLive = false;
    let livePlatform: "twitch" | "kick" = "twitch";

    // Check Twitch using Helix API (requires Client ID and OAuth token)
    // For now, we'll use a simple check via the Twitch embed API
    if (twitchChannel) {
      try {
        // Using undocumented but stable Twitch API endpoint
        const twitchResponse = await fetch(
          `https://gql.twitch.tv/gql`,
          {
            method: "POST",
            headers: {
              "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operationName: "StreamMetadata",
              variables: { channelLogin: twitchChannel },
              extensions: {
                persistedQuery: {
                  version: 1,
                  sha256Hash: "a647c2a13599e5991e175155f798ca7f1ecddde73f7f341f39009c14dbf59962",
                },
              },
            }),
          }
        );

        if (twitchResponse.ok) {
          const data = await twitchResponse.json();
          if (data?.data?.user?.stream) {
            isLive = true;
            livePlatform = "twitch";
            console.log(`Twitch channel ${twitchChannel} is LIVE`);
          } else {
            console.log(`Twitch channel ${twitchChannel} is offline`);
          }
        }
      } catch (e) {
        console.log("Twitch check failed:", e);
      }
    }

    // Check Kick if not already live on Twitch
    if (!isLive && kickChannel) {
      try {
        const kickResponse = await fetch(
          `https://kick.com/api/v2/channels/${kickChannel}`
        );
        
        if (kickResponse.ok) {
          const data = await kickResponse.json();
          if (data?.livestream !== null) {
            isLive = true;
            livePlatform = "kick";
            console.log(`Kick channel ${kickChannel} is LIVE`);
          } else {
            console.log(`Kick channel ${kickChannel} is offline`);
          }
        }
      } catch (e) {
        console.log("Kick check failed:", e);
      }
    }

    // Update the live status in database
    const updates = [
      { key: "is_live", value: isLive },
      { key: "live_platform", value: livePlatform },
      { key: "last_check", value: new Date().toISOString() },
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from("site_settings")
        .upsert(update, { onConflict: "key" });
      
      if (error) {
        console.error(`Failed to update ${update.key}:`, error);
      }
    }

    console.log(`Stream status updated: is_live=${isLive}, platform=${livePlatform}`);

    return new Response(
      JSON.stringify({
        is_live: isLive,
        platform: livePlatform,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error checking stream status:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});