import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate required environment variables
function validateEnv(): { url: string; serviceKey: string } | null {
  const url = (Deno.env.get("SUPABASE_URL") || "").trim();
  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  
  if (!url || !serviceKey) {
    console.error("[event-notifications] Missing required environment variables", {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey,
    });
    return null;
  }
  
  return { url, serviceKey };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const env = validateEnv();
    if (!env) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(env.url, env.serviceKey);

    console.log("Checking for events starting soon...");

    // Get events starting in the next 5 minutes
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    const todayStr = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const targetTime = fiveMinutesFromNow.toTimeString().slice(0, 5);

    console.log(`Checking events for date: ${todayStr}, time between ${currentTime} and ${targetTime}`);

    // Get events happening today with times in the next window
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, title, event_date, event_time, platform")
      .eq("event_date", todayStr)
      .gte("event_time", currentTime)
      .lte("event_time", targetTime);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} events starting soon`);

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No events starting soon", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let notificationsSent = 0;

    for (const event of upcomingEvents) {
      console.log(`Processing event: ${event.title}`);

      // Get users subscribed to this event
      const { data: subscriptions, error: subsError } = await supabase
        .from("event_subscriptions")
        .select("user_id")
        .eq("event_id", event.id);

      if (subsError) {
        console.error(`Error fetching subscriptions for event ${event.id}:`, subsError);
        continue;
      }

      console.log(`Found ${subscriptions?.length || 0} subscribers for event ${event.title}`);

      // Create notifications for each subscribed user
      for (const sub of subscriptions || []) {
        const notification = {
          user_id: sub.user_id,
          title: `🎬 ${event.title} is starting soon!`,
          message: `The event "${event.title}" on ${event.platform || "stream"} starts at ${event.event_time}. Don't miss it!`,
          type: "event",
          link: "/events",
        };

        const { error: notifError } = await supabase
          .from("user_notifications")
          .insert(notification);

        if (notifError) {
          console.error(`Error creating notification for user ${sub.user_id}:`, notifError);
        } else {
          notificationsSent++;
          console.log(`Notification sent to user ${sub.user_id}`);
        }
      }

      // Remove subscriptions after notification sent (one-time notification)
      const { error: deleteError } = await supabase
        .from("event_subscriptions")
        .delete()
        .eq("event_id", event.id);

      if (deleteError) {
        console.error(`Error deleting subscriptions for event ${event.id}:`, deleteError);
      }
    }

    console.log(`Total notifications sent: ${notificationsSent}`);

    return new Response(
      JSON.stringify({ 
        message: "Event notifications processed", 
        events_processed: upcomingEvents.length,
        notifications_sent: notificationsSent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in event-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
