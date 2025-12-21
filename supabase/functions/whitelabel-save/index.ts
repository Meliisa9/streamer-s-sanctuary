import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").trim();
    const anonKey = (Deno.env.get("SUPABASE_ANON_KEY") || "").trim();
    const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

    if (!supabaseUrl || !anonKey || !serviceKey) {
      console.log("[whitelabel-save] missing env", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!anonKey,
        hasServiceKey: !!serviceKey,
      });
      return new Response(
        JSON.stringify({
          error:
            "Backend is missing required env vars for saving white-label settings. If running locally, ensure your backend is started and injects SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY into functions.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = req.headers.get("Authorization") || "";

    console.log("[whitelabel-save] request", {
      method: req.method,
      hasAuthHeader: !!authHeader,
    });

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      console.log("[whitelabel-save] unauthorized", { userError: userError?.message });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { config } = (await req.json().catch(() => ({}))) as {
      config?: Record<string, unknown>;
    };

    if (!config || typeof config !== "object") {
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: isAdminOrMod, error: permError } = await adminClient.rpc(
      "is_admin_or_mod",
      { _user_id: userData.user.id }
    );

    if (permError || !isAdminOrMod) {
      console.log("[whitelabel-save] forbidden", {
        userId: userData.user.id,
        permError: permError?.message,
      });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entries = Object.entries(config);
    const rows = entries.map(([key, value]) => ({
      key: `whitelabel_${key}`,
      value,
    }));

    const { error: upsertError } = await adminClient
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (upsertError) {
      console.log("[whitelabel-save] upsert error", { message: upsertError.message });
      throw upsertError;
    }

    console.log("[whitelabel-save] saved", { count: rows.length, userId: userData.user.id });

    return new Response(JSON.stringify({ ok: true, saved: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.log("[whitelabel-save] unhandled error", {
      message: error?.message || "Unknown error",
    });

    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
