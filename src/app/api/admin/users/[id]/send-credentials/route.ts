import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSmtpConfig, sendMail } from '@/lib/email/mailer'
import { userCreatedEmailTemplate } from '@/lib/email/templates'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ZIII Helpdesk'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const ROLE_LABEL: Record<string, string> = {
  requester: 'Usuario',
  agent_l1: 'Técnico (Nivel 1)',
  agent_l2: 'Técnico (Nivel 2)',
  supervisor: 'Supervisor',
  auditor: 'Auditor',
  admin: 'Administrador',
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createSupabaseServerClient()

    // Verificar autenticación
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos (solo admin)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (currentProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar que SMTP esté configurado
    if (!getSmtpConfig()) {
      return NextResponse.json(
        { error: 'SMTP no configurado. Configura las variables SMTP_* en el servidor.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { temporaryPassword } = body

    if (!temporaryPassword) {
      return NextResponse.json(
        { error: 'Se requiere la contraseña temporal' },
        { status: 400 }
      )
    }

    // Usar admin client para obtener datos del usuario
    const admin = createSupabaseAdminClient()

    // Obtener datos del usuario
    const { data: userProfile, error: profileError } = await admin
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        department
      `)
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener email del usuario desde auth.users
    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(userId)
    
    if (authUserError || !authUser.user?.email) {
      return NextResponse.json(
        { error: 'No se pudo obtener el email del usuario' },
        { status: 404 }
      )
    }

    // Obtener ubicaciones del usuario
    const { data: userLocations } = await admin
      .from('user_locations')
      .select(`
        location:locations (
          name,
          code
        )
      `)
      .eq('user_id', userId)

    const locationNames = userLocations
      ?.map((ul: any) => ul.location?.name)
      .filter(Boolean)
      .join(', ') || 'Sin asignar'

    // Generar email
    const emailData = userCreatedEmailTemplate({
      appName: APP_NAME,
      userName: userProfile.full_name || authUser.user.email,
      userEmail: authUser.user.email,
      temporaryPassword,
      role: ROLE_LABEL[userProfile.role || 'requester'] || userProfile.role || 'Usuario',
      location: locationNames,
      department: userProfile.department || undefined,
      loginUrl: `${APP_URL}/login`,
    })

    // Enviar email
    await sendMail({
      to: authUser.user.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    })

    // Registrar en audit_log
    await admin.from('audit_log').insert({
      entity_type: 'user',
      entity_id: userId,
      action: 'credentials_sent',
      actor_id: currentUser.id,
      metadata: {
        recipient_email: authUser.user.email,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Credenciales enviadas a ${authUser.user.email}`,
    })
  } catch (err: any) {
    console.error('[send-credentials] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error al enviar credenciales' },
      { status: 500 }
    )
  }
}
