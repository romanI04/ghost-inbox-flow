// Full code for classify-email Edge Function
// Classifies email using OpenAI gpt-4o (category, urgency, sentiment, action) and saves to DB (Req 5.2)
// Usage: POST with JSON { message_id: "gmail123", subject: "Test", sender: "test@example.com", body: "Email content here" }
// Requires auth; assumes called from webhook/ingestion (user_id from auth)

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
    const { message_id, subject, sender, body } = await req.json();
    if (!message_id || !body) throw new Error('Missing message_id or body');

    // Call OpenAI for classification
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
    const prompt = `Classify this email: Subject: ${subject} From: ${sender} Body: ${body}
Output JSON only: { "category": "low_risk|medium_risk|high_risk", "urgency": "low|medium|high", "sentiment": "positive|neutral|negative", "required_action": "reply|archive|notify" }`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.3, // Low for consistency
    });
    const classification = JSON.parse(response.choices[0].message.content.trim());

    // Save to DB
    const { error: dbError } = await supabase
      .from('emails')
      .insert({
        user_id: user.id,
        message_id,
        subject,
        sender,
        category: classification.category,
        urgency: classification.urgency,
        sentiment: classification.sentiment,
        required_action: classification.required_action,
        status: 'classified',
      });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ ...classification, message: 'Email classified and saved' }), {
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