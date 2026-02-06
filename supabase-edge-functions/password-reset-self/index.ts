// name: password-reset-self
// DEPLOY THIS TO SUPABASE — replace your existing edge function with this version
// Follows the exact same pattern as the working delete-entity edge function
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

Deno.serve(async (req: Request) => {
  // Handle CORS for browser requests (same as delete-entity)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Extract the token from the authorization header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization token missing' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Create a Supabase client with the user's token (same pattern as delete-entity)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the authenticated user from the token
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized or invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const email = userData.user.email;
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'User has no email; cannot reauthenticate' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Parse the JSON body
    const { current_password: currentPassword, new_password: newPassword } = await req.json();

    if (!currentPassword || typeof currentPassword !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing current_password' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing new_password' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Reauthenticate: verify current password via the REST sign-in endpoint
    const signInResp = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        },
        body: JSON.stringify({ email, password: currentPassword }),
      }
    );

    if (!signInResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Current password verified — update to new password using the admin API
    // We use SERVICE_ROLE_KEY here because auth.updateUser() requires a local
    // session which doesn't exist in a Deno edge function (causes "Auth session missing!")
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await adminClient.auth.admin.updateUserById(userData.user.id, {
      password: newPassword,
    });
    if (error) {
      console.error('admin.updateUserById error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to update password' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err) {
    console.error('Unexpected error in password-reset-self:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
