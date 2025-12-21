import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kick-signature",
};

// Verify webhook signature from Kick
function verifyKickSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  
  try {
    // Kick uses HMAC-SHA256 for webhook signatures
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(payload);
    
    // For now, accept all webhooks if secret is not configured
    // In production, implement proper HMAC verification
    if (!secret) {
      console.warn("Webhook secret not configured - accepting webhook without verification");
      return true;
    }
    
    // TODO: Implement proper HMAC verification when Kick documents their webhook format
    return true;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const kickWebhookSecret = Deno.env.get("KICK_WEBHOOK_SECRET") || "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-kick-signature");
    
    // Verify webhook signature
    if (!verifyKickSignature(rawBody, signature, kickWebhookSecret)) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    console.log("Kick webhook received:", JSON.stringify(payload, null, 2));

    const { event_type, data } = payload;

    // Get the configured Kick channel
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "kick_channel")
      .single();
    
    const configuredChannel = settings?.value;
    console.log("Configured Kick channel:", configuredChannel);

    // Handle different event types
    switch (event_type) {
      case "channel.points.redemption":
      case "points.update":
      case "channel_points_custom_reward_redemption": {
        // Channel points redemption or update event
        const { 
          user_id: kickUserId, 
          username: kickUsername, 
          points, 
          points_balance,
          channel_id,
          channel_name 
        } = data;

        // Verify this is for our configured channel
        if (configuredChannel && channel_name && channel_name.toLowerCase() !== configuredChannel.toLowerCase()) {
          console.log(`Ignoring webhook for channel ${channel_name}, configured channel is ${configuredChannel}`);
          return new Response(JSON.stringify({ success: true, message: "Ignored - different channel" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find user by Kick username or platform_user_id
        const { data: connection, error: connError } = await supabase
          .from("user_channel_points")
          .select("*")
          .eq("platform", "kick")
          .or(`platform_user_id.eq.${kickUserId},platform_username.ilike.${kickUsername}`)
          .single();

        if (connError || !connection) {
          console.log(`No user found for Kick user: ${kickUsername} (${kickUserId})`);
          return new Response(JSON.stringify({ success: true, message: "User not linked" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const oldBalance = connection.points_balance;
        const newBalance = points_balance ?? points ?? oldBalance;
        const diff = newBalance - oldBalance;

        // Update points balance
        await supabase
          .from("user_channel_points")
          .update({
            points_balance: newBalance,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        // Log transaction
        if (diff !== 0) {
          await supabase
            .from("channel_point_transactions")
            .insert({
              user_id: connection.user_id,
              platform: "kick",
              transaction_type: "webhook_sync",
              amount: diff,
              balance_before: oldBalance,
              balance_after: newBalance,
              description: `Points ${diff > 0 ? "earned" : "spent"} via Kick webhook`,
            });
        }

        console.log(`Updated Kick points for user ${connection.user_id}: ${oldBalance} -> ${newBalance}`);

        return new Response(JSON.stringify({
          success: true,
          user_id: connection.user_id,
          old_balance: oldBalance,
          new_balance: newBalance,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "channel.subscribe":
      case "subscription.created": {
        // A user subscribed - could award bonus points
        const { user_id: kickUserId, username: kickUsername, tier } = data;

        const { data: connection } = await supabase
          .from("user_channel_points")
          .select("*")
          .eq("platform", "kick")
          .or(`platform_user_id.eq.${kickUserId},platform_username.ilike.${kickUsername}`)
          .single();

        if (connection) {
          // Award subscription bonus points based on tier
          const bonusPoints = tier === 3 ? 500 : tier === 2 ? 300 : 100;
          const newBalance = connection.points_balance + bonusPoints;

          await supabase
            .from("user_channel_points")
            .update({
              points_balance: newBalance,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", connection.id);

          await supabase
            .from("channel_point_transactions")
            .insert({
              user_id: connection.user_id,
              platform: "kick",
              transaction_type: "subscription_bonus",
              amount: bonusPoints,
              balance_before: connection.points_balance,
              balance_after: newBalance,
              description: `Subscription bonus (Tier ${tier})`,
            });

          console.log(`Awarded ${bonusPoints} Kick points to user ${connection.user_id} for subscription`);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chat.message":
      case "message.created": {
        // Chat activity - could award engagement points
        const { user_id: kickUserId, username: kickUsername } = data;

        const { data: connection } = await supabase
          .from("user_channel_points")
          .select("*")
          .eq("platform", "kick")
          .or(`platform_user_id.eq.${kickUserId},platform_username.ilike.${kickUsername}`)
          .single();

        if (connection) {
          // Award small points for chat activity (rate limited by Kick)
          const activityPoints = 1;
          const newBalance = connection.points_balance + activityPoints;

          await supabase
            .from("user_channel_points")
            .update({
              points_balance: newBalance,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", connection.id);

          // Don't log every chat message transaction to avoid spam
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Manual points update from admin
      case "admin.points.update": {
        const { kick_username, points, operation } = data;

        const { data: connection, error: connError } = await supabase
          .from("user_channel_points")
          .select("*")
          .eq("platform", "kick")
          .ilike("platform_username", kick_username)
          .single();

        if (connError || !connection) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `User with Kick username "${kick_username}" not found` 
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const oldBalance = connection.points_balance;
        let newBalance: number;

        if (operation === "set") {
          newBalance = points;
        } else if (operation === "add") {
          newBalance = oldBalance + points;
        } else if (operation === "subtract") {
          newBalance = Math.max(0, oldBalance - points);
        } else {
          newBalance = points; // Default to set
        }

        await supabase
          .from("user_channel_points")
          .update({
            points_balance: newBalance,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        await supabase
          .from("channel_point_transactions")
          .insert({
            user_id: connection.user_id,
            platform: "kick",
            transaction_type: "admin_adjustment",
            amount: newBalance - oldBalance,
            balance_before: oldBalance,
            balance_after: newBalance,
            description: `Admin ${operation || "set"}: ${points} points`,
          });

        return new Response(JSON.stringify({
          success: true,
          user_id: connection.user_id,
          kick_username,
          old_balance: oldBalance,
          new_balance: newBalance,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        console.log(`Unhandled event type: ${event_type}`);
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Event type ${event_type} acknowledged but not processed` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

  } catch (error: unknown) {
    console.error("Error processing Kick webhook:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
