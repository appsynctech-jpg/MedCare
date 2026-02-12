import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const payload = await req.json()
        const { record, table, type } = payload

        // We only care about INSERTS for now
        if (type !== 'INSERT') {
            return new Response(JSON.stringify({ message: 'Ignored non-insert event' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const userId = record.user_id || (record.medication_id ? await getUserIdFromMed(supabase, record.medication_id) : null)
        if (!userId) return new Response(JSON.stringify({ error: 'User ID not found' }), { status: 400 })

        let alertType: 'missed' | 'skipped' | 'excessive_snooze' | null = null
        let metadata = {}

        if (table === 'medication_logs') {
            if (record.status === 'missed') alertType = 'missed'
            if (record.status === 'skipped') alertType = 'skipped'
        } else if (table === 'medication_snoozes') {
            // Check snooze count for today
            const startOfDay = new Date()
            startOfDay.setHours(0, 0, 0, 0)

            const { count } = await supabase
                .from('medication_snoozes')
                .select('*', { count: 'exact', head: true })
                .eq('schedule_id', record.schedule_id)
                .gte('created_at', startOfDay.toISOString())

            if (count && count >= 3) {
                // Only alert on the 3rd snooze (or multiples if needed, but 3 is a good threshold)
                if (count === 3) alertType = 'excessive_snooze'
                metadata = { snooze_count: count }
            }
        }

        if (!alertType) {
            return new Response(JSON.stringify({ message: 'No alert criteria met' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Check if we already sent this alert today to avoid spamming
        const { data: existingAlert } = await supabase
            .from('medication_notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('schedule_id', record.schedule_id)
            .eq('alert_type', alertType)
            .gte('sent_at', new Date(Date.now() - 3600000).toISOString()) // Within last hour
            .limit(1)

        if (existingAlert && existingAlert.length > 0) {
            return new Response(JSON.stringify({ message: 'Alert already sent recently' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Fetch User and Contacts
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
        const { data: contacts } = await supabase.from('emergency_contacts').select('*').eq('user_id', userId)
        const { data: med } = await supabase.from('medications').select('name').eq('id', record.medication_id).single()

        if (!contacts || contacts.length === 0) {
            return new Response(JSON.stringify({ message: 'No emergency contacts found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Prepare message
        const userName = profile?.full_name || 'Um usuário'
        const medName = med?.name || 'seu medicamento'
        let message = ''

        if (alertType === 'missed') message = `ALERTA DE SEGURANÇA: ${userName} não registrou a dose de ${medName} no horário previsto.`
        if (alertType === 'skipped') message = `AVISO: ${userName} decidiu pular a dose de ${medName}.`
        if (alertType === 'excessive_snooze') message = `PREOCUPAÇÃO: ${userName} adiou o alarme de ${medName} por 3 vezes consecutivas.`

        // Send notifications (Email via Resend if available, or just log for now)
        // Note: To use Resend, you'd add: 
        // fetch('https://api.resend.com/emails', { ... })

        for (const contact of contacts) {
            // Insert into notifications log
            await supabase.from('medication_notifications').insert({
                user_id: userId,
                medication_id: record.medication_id,
                schedule_id: record.schedule_id,
                contact_id: contact.id,
                alert_type: alertType,
                metadata: { ...metadata, message, contact_name: contact.name, contact_phone: contact.phone }
            })

            console.log(`Alert sent to ${contact.name} (${contact.phone}): ${message}`)

            // Real notification logic would go here (SMS/Push/Email)
            if (contact.email) {
                await sendEmail(contact.email, `Alerta MedCare: ${userName}`, message)
            }
        }

        return new Response(JSON.stringify({ message: `Alerts processed for ${contacts.length} contacts` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})

async function getUserIdFromMed(supabase: any, medId: string) {
    const { data } = await supabase.from('medications').select('user_id').eq('id', medId).single()
    return data?.user_id
}

async function sendEmail(to: string, subject: string, text: string) {
    const brevoKey = Deno.env.get('BREVO_API_KEY')
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'appsynctech@gmail.com'

    if (!brevoKey) {
        console.error('BREVO_API_KEY not set. Cannot send email.')
        return
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': brevoKey,
            },
            body: JSON.stringify({
                sender: {
                    name: 'MedCare Alerta',
                    email: senderEmail,
                },
                to: [
                    {
                        email: to,
                    }
                ],
                subject: subject,
                textContent: text,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Brevo API error:', errorData)
        } else {
            console.log(`Email successfully sent to ${to} via Brevo`)
        }
    } catch (e) {
        console.error('Failed to send email via Brevo:', e)
    }
}
