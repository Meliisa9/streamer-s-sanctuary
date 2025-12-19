import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use Web Crypto API for hashing (Deno-native, no external dependencies)
async function hashCode(code: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user's JWT
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, code } = await req.json();
    console.log(`Admin code action: ${action} for user: ${user.id}`);

    if (action === 'check') {
      // Check if user has an access code set
      const { data, error } = await supabaseAdmin
        .from('admin_access_codes')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking access code:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ hasCode: !!data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'set') {
      // Validate code length
      if (!code || code.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Code must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate salt and hash the code
      const salt = generateSalt();
      const hashedCode = await hashCode(code, salt);
      const storedValue = `${salt}:${hashedCode}`;
      console.log('Generated hash for new access code');

      // Upsert the hashed code
      const { error } = await supabaseAdmin
        .from('admin_access_codes')
        .upsert({
          user_id: user.id,
          access_code: storedValue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error setting access code:', error);
        throw error;
      }

      console.log('Access code set successfully');
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the stored hash
      const { data, error } = await supabaseAdmin
        .from('admin_access_codes')
        .select('access_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching access code:', error);
        return new Response(
          JSON.stringify({ verified: false, error: 'Database error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ verified: false, error: 'No access code found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse stored value (salt:hash format)
      const storedValue = data.access_code;
      let isValid = false;

      if (storedValue.includes(':')) {
        // New format: salt:hash
        const [salt, storedHash] = storedValue.split(':');
        const inputHash = await hashCode(code, salt);
        isValid = inputHash === storedHash;
      } else {
        // Legacy bcrypt format - we can't verify these, user needs to reset
        console.log('Legacy bcrypt hash detected, cannot verify');
        return new Response(
          JSON.stringify({ verified: false, error: 'Please reset your access code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Verification result: ${isValid}`);

      return new Response(
        JSON.stringify({ verified: isValid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in admin-code function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
