import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch share record
    const { data: share, error: shareError } = await supabase
      .from('shared_access')
      .select('*')
      .eq('access_token', token)
      .eq('revoked', false)
      .single()

    if (shareError || !share) {
      return new Response(JSON.stringify({ error: 'Link inválido ou revogado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (new Date(share.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Link expirado' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const targetId = share.profile_id || share.user_id
    const perms = share.permissions as Record<string, boolean>
    const result: Record<string, unknown> = {}

    // Get owner/profile name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', targetId).single()
    result.owner_name = profile?.full_name || 'Usuário'
    result.expires_at = share.expires_at
    result.access_level = share.access_level

    if (perms.medications) {
      const { data: medications } = await supabase.from('medications').select('*, medication_schedules(*)').eq('user_id', targetId).eq('active', true)
      result.medications = medications || []

      // Buscar logs de adesão (últimos 30 dias por padrão)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data: logs } = await supabase
        .from('medication_logs')
        .select('*, medications!inner(name, user_id)')
        .eq('medications.user_id', targetId)
        .gte('scheduled_time', startDate.toISOString())
        .order('scheduled_time', { ascending: false })

      result.medication_logs = logs || []
    }

    if (perms.appointments) {
      const { data } = await supabase.from('appointments').select('*, doctors(*)').eq('user_id', targetId).gte('appointment_date', new Date().toISOString()).order('appointment_date')
      result.appointments = data || []
    }

    if (perms.documents) {
      const { data } = await supabase.from('medical_documents').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
      result.documents = data || []
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
