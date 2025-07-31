// Full code for update-tone Edge Function
// Saves tone sliders to DB for authenticated user (Req 5.3)
// Usage: POST with JSON { formality: 70, emoji_usage: 30, brevity: 80 }
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

    // Parse body - support both 'emoji' and 'emoji_usage' parameter names
    const body = await req.json();
    console.log('Received body:', body);
    
    // Extract values with proper names
    const formality = body.formality;
    const emoji_usage = body.emoji_usage !== undefined ? body.emoji_usage : body.emoji;
    const brevity = body.brevity;
    
    // Validate that all required parameters are present and are numbers
    if (typeof formality !== 'number') {
      throw new Error('Invalid input: formality must be a number (0-100)');
    }
    if (typeof emoji_usage !== 'number') {
      throw new Error('Invalid input: emoji_usage must be a number (0-100)');
    }
    if (typeof brevity !== 'number') {
      throw new Error('Invalid input: brevity must be a number (0-100)');
    }
    
    // Validate ranges
    if (formality < 0 || formality > 100) {
      throw new Error('Invalid input: formality must be between 0 and 100');
    }
    if (emoji_usage < 0 || emoji_usage > 100) {
      throw new Error('Invalid input: emoji_usage must be between 0 and 100');
    }
    if (brevity < 0 || brevity > 100) {
      throw new Error('Invalid input: brevity must be between 0 and 100');
    }

    console.log(`Updating tone for user ${user.id}:`, { formality, emoji_usage, brevity });

    // Upsert to DB
    const { error: dbError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        formality,
        emoji_usage,
        brevity,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Tone settings updated successfully');
    return new Response(JSON.stringify({ 
      message: 'Tone settings updated successfully',
      preferences: { formality, emoji_usage, brevity }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Update tone error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});