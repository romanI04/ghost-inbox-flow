// Edge Function to handle Google OAuth and capture provider tokens
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  try {
    console.log(`=== FUNCTION START: ${req.method} ${req.url} ===`);
    
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method === 'GET') {
      // Handle OAuth callback from Google - no authorization needed
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // Should contain user_id
      
      console.log(`OAuth callback received:`);
      console.log(`- code: ${code ? 'PRESENT' : 'MISSING'} (length: ${code?.length || 0})`);
      console.log(`- state: ${state || 'MISSING'}`);
      console.log(`- Full URL: ${req.url}`);
      
      if (!code || !state) {
        console.error('❌ Missing code or state in OAuth callback');
        const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';
        return new Response('', {
          status: 302,
          headers: { 
            'Location': `${appUrl}/oauth-callback?error=missing_parameters`,
            ...corsHeaders
          },
        });
      }

      // Check environment variables
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const appUrl = Deno.env.get('APP_URL');

      console.log(`Environment check:`);
      console.log(`- clientId: ${clientId ? 'SET' : 'MISSING'}`);
      console.log(`- clientSecret: ${clientSecret ? 'SET' : 'MISSING'}`);
      console.log(`- supabaseUrl: ${supabaseUrl || 'MISSING'}`);
      console.log(`- serviceRoleKey: ${serviceRoleKey ? 'SET' : 'MISSING'}`);
      console.log(`- appUrl: ${appUrl || 'MISSING'}`);

      if (!clientId || !clientSecret || !supabaseUrl || !serviceRoleKey || !appUrl) {
        console.error('❌ Missing required environment variables');
        return new Response('', {
          status: 302,
          headers: { 
            'Location': `${appUrl || 'http://localhost:8080'}/oauth-callback?error=server_config`,
            ...corsHeaders
          },
        });
      }

      try {
        // Exchange code for tokens
        console.log('🔄 Exchanging code for tokens...');
        const tokenRequestBody = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${supabaseUrl}/functions/v1/capture-google-tokens`,
        });
        
        console.log(`Token request to: https://oauth2.googleapis.com/token`);
        console.log(`Redirect URI: ${supabaseUrl}/functions/v1/capture-google-tokens`);
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenRequestBody,
        });

        console.log(`Token response status: ${tokenResponse.status}`);
        const tokens = await tokenResponse.json();
        console.log(`Token response keys: ${Object.keys(tokens).join(', ')}`);
        
        if (!tokenResponse.ok) {
          console.error('❌ Google token exchange failed:', tokens);
          return new Response('', {
            status: 302,
            headers: { 
              'Location': `${appUrl}/oauth-callback?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(tokens))}`,
              ...corsHeaders
            },
          });
        }
        
        if (!tokens.access_token) {
          console.error('❌ No access token in response:', tokens);
          return new Response('', {
            status: 302,
            headers: { 
              'Location': `${appUrl}/oauth-callback?error=no_access_token`,
              ...corsHeaders
            },
          });
        }
        
        console.log(`✅ Token exchange successful - access_token: ${tokens.access_token ? 'PRESENT' : 'MISSING'}`);
        console.log(`✅ Refresh token: ${tokens.refresh_token ? 'PRESENT' : 'MISSING'}`);
        
        // Store tokens in database
        console.log('💾 Storing tokens in database...');
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const tokenData = {
          user_id: state,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          scope: tokens.scope,
        };
        
        console.log(`Storing token data for user: ${state}`);
        console.log(`Token expires in: ${tokens.expires_in || 3600} seconds`);
        
        const { data, error } = await supabase.from('provider_tokens').upsert(tokenData);

        if (error) {
          console.error('❌ Database error:', error);
          return new Response('', {
            status: 302,
            headers: { 
              'Location': `${appUrl}/oauth-callback?error=database_error&details=${encodeURIComponent(error.message)}`,
              ...corsHeaders
            },
          });
        }

        console.log('✅ Tokens stored successfully in database');
        console.log('🔄 Redirecting to success page...');
        
        // Redirect user back to app
        return new Response('', {
          status: 302,
          headers: { 
            'Location': `${appUrl}/oauth-callback?oauth=success`,
            ...corsHeaders
          },
        });
      } catch (error) {
        console.error('❌ OAuth processing error:', error);
        const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';
        return new Response('', {
          status: 302,
          headers: { 
            'Location': `${appUrl}/oauth-callback?error=processing_error&details=${encodeURIComponent(error.message)}`,
            ...corsHeaders
          },
        });
      }
    }

    if (req.method === 'POST') {
      // Initiate OAuth flow - requires authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const { user_id } = await req.json();
        console.log(`Initiating OAuth for user: ${user_id}`);
        
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId!);
        authUrl.searchParams.set('redirect_uri', `${supabaseUrl}/functions/v1/capture-google-tokens`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.modify openid email profile');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', user_id);

        console.log(`Generated auth URL: ${authUrl.toString()}`);

        return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('❌ POST error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  } catch (error) {
    console.error('❌ FUNCTION ERROR:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 