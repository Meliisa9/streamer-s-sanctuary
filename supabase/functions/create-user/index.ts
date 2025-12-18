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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Only admins can manage users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, user_id, email, password, username, display_name, new_email } = await req.json();

    // Handle delete user
    if (action === "delete") {
      console.log("Delete user request:", { user_id, requestingUser: requestingUser.id });
      
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (user_id === requestingUser.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // First delete related data that may block cascade
      try {
        // Delete user roles
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        // Delete profile
        await supabaseAdmin.from("profiles").delete().eq("user_id", user_id);
        // Delete notification preferences
        await supabaseAdmin.from("notification_preferences").delete().eq("user_id", user_id);
        // Delete giveaway entries
        await supabaseAdmin.from("giveaway_entries").delete().eq("user_id", user_id);
        // Delete poll votes
        await supabaseAdmin.from("poll_votes").delete().eq("user_id", user_id);
        // Delete gtw guesses
        await supabaseAdmin.from("gtw_guesses").delete().eq("user_id", user_id);
        // Delete user notifications
        await supabaseAdmin.from("user_notifications").delete().eq("user_id", user_id);
        // Delete user achievements
        await supabaseAdmin.from("user_achievements").delete().eq("user_id", user_id);
        // Delete article likes
        await supabaseAdmin.from("article_likes").delete().eq("user_id", user_id);
        // Delete comment likes
        await supabaseAdmin.from("comment_likes").delete().eq("user_id", user_id);
        // Delete video likes
        await supabaseAdmin.from("video_likes").delete().eq("user_id", user_id);
        // Delete news comments
        await supabaseAdmin.from("news_comments").delete().eq("user_id", user_id);
      } catch (cleanupError) {
        console.log("Cleanup error (non-fatal):", cleanupError);
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (deleteError) {
        console.error("Delete user error:", deleteError);
        return new Response(JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log("User deleted successfully:", user_id);
      return new Response(JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle update email
    if (action === "update_email") {
      if (!user_id || !new_email) {
        return new Response(JSON.stringify({ error: "user_id and new_email are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user_id,
        { email: new_email, email_confirm: true }
      );

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true, user: { id: updatedUser.user.id, email: updatedUser.user.email } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle create user
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { username, display_name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, user: { id: newUser.user.id, email: newUser.user.email } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
