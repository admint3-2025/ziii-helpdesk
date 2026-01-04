import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/email/mailer'
import { locationSummaryEmailTemplate } from '@/lib/email/templates'

const OPEN_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'NEEDS_INFO', 'WAITING_THIRD_PARTY']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar rol (solo admin / supervisor pueden enviar reportes de sede)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'supervisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const locationId = body?.locationId as string | undefined
    const includeLocationRecipients =
      typeof body?.includeLocationRecipients === 'boolean'
        ? (body.includeLocationRecipients as boolean)
        : true
    const additionalEmailsRaw = (body?.additionalEmails as string[] | undefined) ?? []

    if (!locationId) {
      return NextResponse.json({ error: 'locationId requerido' }, { status: 400 })
    }

    // Obtener datos agregados de la sede
    const { data: statsRow, error: statsError } = await supabase
      .from('location_incident_stats')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle()

    if (statsError || !statsRow) {
      return NextResponse.json({ error: 'No se encontraron estadísticas para la sede' }, { status: 404 })
    }

    // Obtener tickets abiertos más relevantes de la sede
    const { data: openTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status, priority, created_at')
      .eq('location_id', locationId)
      .is('deleted_at', null)
      .in('status', OPEN_STATUSES)
      .order('created_at', { ascending: true })
      .limit(10)

    if (ticketsError) {
      console.error('[location-summary] Error obteniendo tickets abiertos:', ticketsError)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const now = new Date()

    const openTicketsList = (openTickets ?? []).map((t) => {
      const created = t.created_at ? new Date(t.created_at as string) : now
      const diffMs = now.getTime() - created.getTime()
      const ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

      return {
        ticketNumber: String(t.ticket_number ?? ''),
        title: String(t.title ?? ''),
        priority: String(t.priority ?? 'Media'),
        status: String(t.status ?? ''),
        ageDays,
        ticketUrl: `${baseUrl}/tickets/${t.id}`,
      }
    })

    // Obtener destinatarios desde función de usuarios notificables, filtrando por sede
    const { data: notifiable, error: notifiableError } = await supabase.rpc(
      'get_notifiable_users_with_locations'
    )

    if (notifiableError) {
      console.error('[location-summary] Error obteniendo usuarios notificables:', notifiableError)
    }

    const locationCode: string = statsRow.location_code
    const locationName: string = statsRow.location_name

    let recipients: string[] = []

    if (includeLocationRecipients) {
      const fromLocation = (notifiable ?? [])
        .filter((u: any) => !!u.email)
        .filter((u: any) => {
          const codesRaw = String(u.location_codes ?? '')
          if (!codesRaw) return false
          const codes = codesRaw.split(',').map((c) => c.trim())
          return codes.includes('Todas') || codes.includes(locationCode)
        })
        .map((u: any) => String(u.email))

      recipients = recipients.concat(fromLocation)
    }

    const additionalEmails = additionalEmailsRaw
      .map((e) => String(e || '').trim())
      .filter((e) => !!e)

    recipients = recipients.concat(additionalEmails)

    const uniqueRecipients = Array.from(new Set(recipients))

    if (!uniqueRecipients.length) {
      return NextResponse.json(
        { error: 'No se encontraron destinatarios válidos para esta sede' },
        { status: 400 }
      )
    }

    const template = locationSummaryEmailTemplate({
      locationCode,
      locationName,
      summaryLabel: 'Resumen ejecutivo de incidencias por sede',
      totalTickets: Number(statsRow.total_tickets ?? 0),
      openTickets: Number(statsRow.open_tickets ?? 0),
      closedTickets: Number(statsRow.closed_tickets ?? 0),
      avgResolutionDays: Number(statsRow.avg_resolution_days ?? 0),
      openTicketsList,
    })

    // Enviar el correo a todos los responsables identificados
    await Promise.all(
      uniqueRecipients.map((email) =>
        sendMail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
      )
    )

    return NextResponse.json({ ok: true, sentTo: uniqueRecipients })
  } catch (error) {
    console.error('[location-summary] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno al generar el reporte' }, { status: 500 })
  }
}
