// Full code for setup-watch Edge Function (one-time setup/renew watch on inbox)
// Calls Gmail API to watch inbox, link to Pub/Sub topic (Req 5.2)
// Usage: POST with no body; requires user OAuth token for Gmail access

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Get user's Google OAuth tokens from provider_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('provider_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();
    
    if (tokenError || !tokenData) {
      throw new Error('No Google OAuth tokens found for user. Please re-authenticate with Google.');
    }
    
    let googleToken = tokenData.access_token;
    
    // Check if token needs refreshing
    if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
      console.log('Access token expired, refreshing...');
      
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        googleToken = refreshData.access_token;
        
        // Update stored token
        await supabase.from('provider_tokens').update({
          access_token: refreshData.access_token,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        }).eq('user_id', user.id).eq('provider', 'google');
        
        console.log('Token refreshed successfully');
      } else {
        throw new Error('Failed to refresh Google OAuth token');
      }
    }

    // Call Gmail watch API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labelIds: ['INBOX'],
        topicName: 'projects/ghost-inbox-466707/topics/inghost-email-notifications', // Replace with your topic full name
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Gmail watch failed: ${err.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gmail watch setup successful:', data);
    
    return new Response(JSON.stringify({ 
      message: 'Watch set up successfully', 
      expiration: data.expiration,
      historyId: data.historyId 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Setup watch error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});