// Edge Function to classify incoming emails using OpenAI GPT-4o
// Analyzes category, urgency, sentiment, and required action

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
    console.log('🤖 Classify-email function called');
    
    // Simplified authentication - handle both user JWT and service role with user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      throw new Error('Missing Authorization header');
    }
    
    let userId;
    const userIdHeader = req.headers.get('X-User-Id');
    const token = authHeader.replace('Bearer ', '');
    
    console.log('🔑 Auth token type:', token.substring(0, 20) + '...', 'User-ID header:', userIdHeader);
    
    // Check if this is a service role key
    const isServiceRole = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (isServiceRole && userIdHeader) {
      // Internal call with service role - use provided user ID
      userId = userIdHeader;
      console.log('🔧 Service role call with User ID:', userId);
    } else {
      // Regular user call - get user from JWT
      try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('❌ JWT auth failed:', userError);
          throw new Error('Unauthorized - invalid JWT');
        }
        userId = user.id;
        console.log('👤 User JWT call with User ID:', userId);
      } catch (jwtError) {
        console.error('❌ JWT processing error:', jwtError);
        throw new Error(`JWT processing failed: ${jwtError.message}`);
      }
    }
    
    // Create Supabase client for DB operations (always use service role for DB access)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Parse body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 Request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse JSON body:', parseError);
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }
    
    const { message_id, subject, sender, body } = requestBody;
    if (!message_id) {
      console.error('❌ Missing message_id in request');
      throw new Error('Missing required field: message_id');
    }
    if (!body) {
      console.error('❌ Missing body in request');
      throw new Error('Missing required field: body');
    }
    
    console.log(`📧 Processing email: ${subject} from ${sender}`);

    // Call OpenAI for classification
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
    const prompt = `Classify this email with specific criteria:

Subject: ${subject}
From: ${sender}
Body: ${body}

CLASSIFICATION RULES:
- HIGH_RISK: Contains "URGENT", "ASAP", "EOD", deadlines, budget approvals, legal matters, security issues, or requests requiring immediate action
- MEDIUM_RISK: Time-sensitive but not urgent, meeting requests, project updates requiring response within 24-48 hours
- LOW_RISK: Newsletters, notifications, FYI emails, marketing, no action needed

- HIGH URGENCY: Contains urgent keywords, tight deadlines (same day), critical business decisions
- MEDIUM URGENCY: Important but can wait 1-2 days, scheduled meetings, project deadlines
- LOW URGENCY: No deadline, informational, marketing emails

- REPLY: Requires a response from the recipient
- ARCHIVE: Can be filed away, no action needed
- NOTIFY: Important to read but may not need immediate response

Output JSON only: { "category": "low_risk|medium_risk|high_risk", "urgency": "low|medium|high", "sentiment": "positive|neutral|negative", "required_action": "reply|archive|notify" }`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.3, // Low for consistency
    });
    // Extract JSON from OpenAI response (handle markdown code blocks)
    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('OpenAI classification response:', content);
    const classification = JSON.parse(content);

    // Save to DB
    const { error: dbError } = await supabase
      .from('emails')
      .insert({
        user_id: userId,
        message_id,
        subject,
        sender,
        category: classification.category,
        urgency: classification.urgency,
        sentiment: classification.sentiment,
        required_action: classification.required_action,
        status: 'classified',
      });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('✅ Email classified and saved successfully');
    return new Response(JSON.stringify({ 
      ...classification, 
      message: 'Email classified and saved',
      message_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('💥 Error in classify-email:', error);
    
    // Determine appropriate status code
    let statusCode = 500; // Default to server error
    if (error.message.includes('Missing') || error.message.includes('Invalid JSON')) {
      statusCode = 400; // Bad request for client errors
    } else if (error.message.includes('Unauthorized')) {
      statusCode = 401; // Unauthorized
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});