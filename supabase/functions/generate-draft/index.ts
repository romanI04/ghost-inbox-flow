// Full code for generate-draft Edge Function
// Generates tone-matched draft using gpt-4o, decides action (auto-send if low-risk), updates DB (Req 5.3)
// Usage: POST with JSON { email_id: "uuid-from-emails-table" }
// Fetches email/tone from DB, requires auth

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4"; // Official OpenAI library via esm.sh

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
    // Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Parse body
    const { email_id } = await req.json();
    if (!email_id) throw new Error('Missing email_id');

    // Fetch email and user tone
    const { data: email, error: emailError } = await supabase.from('emails').select('*').eq('id', email_id).eq('user_id', user.id).single();
    if (emailError || !email) throw new Error('Email not found');
    const { data: tone, error: toneError } = await supabase.from('user_preferences').select('formality, emoji_usage, brevity').eq('user_id', user.id).single();
    if (toneError) throw toneError;

    // Generate draft with OpenAI (few-shot from historical—mock here; real: fetch last 50 sent)
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
    const prompt = `Generate a reply to this email: Subject: ${email.subject} Body: ${email.body}
Match user tone: Formality ${tone?.formality || 50}%, Emoji ${tone?.emoji_usage || 50}%, Brevity ${tone?.brevity || 50}%.
Output reply text only.`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });
    const draftReply = response.choices[0].message.content.trim();

    // Decide action and update DB
    let status = 'pending';
    if (email.category === 'low_risk') {
      status = 'auto_sent';
      // TODO: Integrate Gmail API to actually send (in Phase 8)
    }
    const { error: updateError } = await supabase
      .from('emails')
      .update({ draft_reply: draftReply, status })
      .eq('id', email_id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ draft: draftReply, status, message: 'Draft generated' }), {
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