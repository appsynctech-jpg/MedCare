import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth check failed. Header:', req.headers.get('Authorization')?.substring(0, 20) + '...')
      console.error('Auth error details:', JSON.stringify(authError))
      return new Response(JSON.stringify({ error: `Unauthorized: ${authError?.message || 'User not found'}` }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { shared_with_email, permissions, access_level, duration_days, profile_id } = await req.json()

    if (!shared_with_email || !permissions || !access_level) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const access_token = crypto.randomUUID()

    let expires_at: string
    if (duration_days === 999999) {
      expires_at = '9999-12-31T23:59:59.999Z'
    } else {
      expires_at = new Date(Date.now() + (duration_days || 7) * 86400000).toISOString()
    }

    // Verify ownership if profile_id is different from user.id
    const targetProfileId = profile_id || user.id;

    if (targetProfileId !== user.id) {
      // Check if user manages this profile
      const { data: relationship } = await supabase
        .from('caregiver_relationships')
        .select('id')
        .eq('caregiver_id', user.id)
        .eq('patient_id', targetProfileId)
        .maybeSingle();

      if (!relationship) {
        return new Response(JSON.stringify({ error: 'Você não tem permissão para compartilhar este perfil.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    console.log('Inserting share for user:', user.id, 'profile:', targetProfileId)
    const { data, error } = await supabase.from('shared_access').insert({
      user_id: user.id,
      profile_id: targetProfileId,
      shared_with_email,
      access_token,
      permissions,
      access_level,
      expires_at,
    }).select().single()

    if (error) {
      console.error('Database error details:', JSON.stringify(error))
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('Share inserted successfully:', data.id)
    const responseBody = { share: data, link: `${req.headers.get('origin') || ''}/shared/${access_token}` }
    console.log('Returning response:', JSON.stringify(responseBody))

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    console.error('Critical function error:', e.message)
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
