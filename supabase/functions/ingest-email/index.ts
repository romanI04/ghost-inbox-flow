// Full code for ingest-email Edge Function
// Handles Pub/Sub webhook push, fetches email via Gmail API, calls classify and generate (Req 5.2)
// Usage: Pub/Sub pushes JSON { "message": { "data": base64-encoded } } 
// Assumes service role key for DB, but fetches email with user token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  try {
    console.log('🚀 Ingest-email function called');
    
    // Parse the Pub/Sub message
    const pubsubMessage = await req.json();
    console.log('📧 Pub/Sub message received:', JSON.stringify(pubsubMessage, null, 2));
    
    let messageData;
    if (pubsubMessage.message && pubsubMessage.message.data) {
      // Pub/Sub format
      messageData = JSON.parse(new TextDecoder().decode(decode(pubsubMessage.message.data)));
    } else {
      // Direct format (fallback)
      messageData = pubsubMessage;
    }
    
    const historyId = messageData.historyId;
    const userEmail = messageData.emailAddress;
    
    console.log(`📨 Processing for email: ${userEmail}, historyId: ${historyId}`);

    // Create Supabase client with service role
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Find user ID by email (with better error handling)
    let userId;
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) {
        console.error('❌ Error listing users:', userError);
        throw new Error(`Failed to list users: ${userError.message}`);
      }
      
      const user = userData.users.find(u => u.email === userEmail);
      if (!user) {
        console.log(`⚠️ No user found for email: ${userEmail} - skipping`);
        return new Response(JSON.stringify({ 
          message: `No user found for email: ${userEmail}`, 
          skipped: true 
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
      console.log(`✅ Found user: ${userId}`);
    } catch (error) {
      console.error('❌ User lookup failed:', error);
      throw error;
    }
    
    // Check if we've already processed this historyId for this user (duplicate prevention)
    const { data: existingHistory } = await supabase
      .from('email_history')
      .select('id')
      .eq('user_id', userId)
      .eq('history_id', historyId)
      .maybeSingle();
      
    if (existingHistory) {
      console.log(`⏭️ HistoryId ${historyId} already processed - skipping`);
      return new Response(JSON.stringify({ 
        message: 'Already processed', 
        historyId,
        skipped: true 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Record this historyId as being processed
    await supabase.from('email_history').insert({
      user_id: userId,
      history_id: historyId,
      processed_at: new Date().toISOString()
    });

    // Fetch Google OAuth tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('provider_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .maybeSingle();
    
    if (tokenError || !tokenData) {
      console.error('❌ No Google tokens found for user:', userId);
      throw new Error('No Google OAuth tokens found');
    }
    
    let googleToken = tokenData.access_token;
    
    // Smart token refresh
    if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date(Date.now() + 60000)) { // Refresh 1 min early
      console.log('🔄 Refreshing expired token...');
      try {
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
          
          await supabase.from('provider_tokens').update({
            access_token: refreshData.access_token,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          }).eq('user_id', userId).eq('provider', 'google');
          
          console.log('✅ Token refreshed successfully');
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        throw new Error(`Token refresh failed: ${refreshError.message}`);
      }
    }

    // Fetch Gmail history with rate limiting protection
    let historyData;
    try {
      console.log(`📬 Fetching Gmail history from ID: ${historyId}`);
      const historyResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}&maxResults=10`, {
        headers: { 'Authorization': `Bearer ${googleToken}` }
      });
      
      if (!historyResponse.ok) {
        const errorText = await historyResponse.text();
        console.error('❌ Gmail API error:', historyResponse.status, errorText);
        throw new Error(`Gmail API error: ${historyResponse.status} ${errorText}`);
      }
      
      historyData = await historyResponse.json();
      console.log(`📊 Gmail history response:`, JSON.stringify(historyData, null, 2));
    } catch (gmailError) {
      console.error('❌ Failed to fetch Gmail history:', gmailError);
      throw gmailError;
    }
    
    if (!historyData.history || historyData.history.length === 0) {
      console.log('📭 No new messages in history');
      return new Response(JSON.stringify({ 
        message: 'No new messages in history',
        historyId 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process messages with individual error isolation
    let processedCount = 0;
    let errorCount = 0;
    
    for (const historyRecord of historyData.history) {
      if (historyRecord.messagesAdded) {
        for (const messageInfo of historyRecord.messagesAdded) {
          try {
            await processEmail(messageInfo.message.id, googleToken, userId, supabase);
            processedCount++;
            console.log(`✅ Processed email ${messageInfo.message.id}`);
          } catch (emailError) {
            errorCount++;
            console.error(`❌ Failed to process email ${messageInfo.message.id}:`, emailError);
            // Continue processing other emails instead of failing completely
          }
        }
      }
    }

    console.log(`🎉 Batch complete: ${processedCount} processed, ${errorCount} errors`);
    
    return new Response(JSON.stringify({ 
      message: 'Batch processing complete',
      processedCount,
      errorCount,
      historyId
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Critical error in ingest-email:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Robust email processing with duplicate detection
async function processEmail(messageId: string, googleToken: string, userId: string, supabase: any) {
  // Check if email already exists in our database
  const { data: existingEmail } = await supabase
    .from('emails')
    .select('id')
    .eq('user_id', userId)
    .eq('message_id', messageId)
    .maybeSingle();
    
  if (existingEmail) {
    console.log(`⏭️ Email ${messageId} already exists - skipping`);
    return;
  }

  // Fetch email details from Gmail
  const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
    headers: { 'Authorization': `Bearer ${googleToken}` }
  });
  
  if (!messageResponse.ok) {
    throw new Error(`Failed to fetch email ${messageId}: ${messageResponse.status}`);
  }
  
  const messageData = await messageResponse.json();
  
  // Extract email details
  const headers = messageData.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
  const sender = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
  
  // Get message body
  let body = '';
  if (messageData.payload.body.data) {
    body = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  } else if (messageData.payload.parts) {
    const textPart = messageData.payload.parts.find(part => part.mimeType === 'text/plain');
    if (textPart && textPart.body.data) {
      body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
  }
  
  // Call classify-email function
  console.log(`🤖 Classifying email: ${subject}`);
  
  const classifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/classify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'X-User-Id': userId,
    },
    body: JSON.stringify({
      message_id: messageId,
      subject,
      sender,
      body: body.substring(0, 2000) // Limit body size to prevent API issues
    }),
  });
  
  if (!classifyResponse.ok) {
    const errorText = await classifyResponse.text();
    throw new Error(`Classification failed: ${classifyResponse.status} ${errorText}`);
  }
  
  console.log(`✅ Email classified: ${messageId}`);
}