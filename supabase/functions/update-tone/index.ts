// Full code for update-tone Edge Function
// Saves tone sliders to DB for authenticated user (Req 5.3)
// Usage: POST with JSON { formality: 70, emoji: 30, brevity: 80 }
// Requires Authorization header with user JWT (from frontend session)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // Authenticate user via Supabase (requires Authorization header)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse body
    const { formality, emoji, brevity } = await req.json();
    if (typeof formality !== 'number' || typeof emoji !== 'number' || typeof brevity !== 'number') {
      throw new Error('Invalid input: formality, emoji, brevity must be numbers (0-100)');
    }

    // Upsert to DB
    const { error: dbError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        formality,
        emoji_usage: emoji,
        brevity,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      throw dbError;
    }

    return new Response(JSON.stringify({ message: 'Tone settings updated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});