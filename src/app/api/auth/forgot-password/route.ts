import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSmtpConfig, sendMail } from '@/lib/email/mailer'
import { passwordRecoveryEmailTemplate } from '@/lib/email/templates'
import { rateLimit, getClientIdentifier } from '@/lib/security/rate-limit'
import { emailSchema } from '@/lib/security/validation'
import { logAuthEvent } from '@/lib/security/audit'

export async function POST(request: Request) {
  // Rate limiting: 3 requests per 15 minutes per IP
  const identifier = getClientIdentifier(request)
  const allowed = rateLimit(`forgot-password:${identifier}`, {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000,
  })

  if (!allowed) {
    await logAuthEvent('RATE_LIMIT_EXCEEDED', {
      ip: identifier,
      endpoint: '/api/auth/forgot-password',
    })
    return new Response('Too many requests. Please try again later.', { status: 429 })
  }

  const smtpConfigured = Boolean(getSmtpConfig())
  if (!smtpConfigured) {
    return new Response('SMTP is not configured', { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Validate email with Zod
  const emailParse = emailSchema.safeParse((body as any)?.email)
  if (!emailParse.success) {
    return new Response('Invalid email address', { status: 400 })
  }
  const email = emailParse.data

  const origin = new URL(request.url).origin
  const redirectTo = `${origin}/auth/reset`

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  // Avoid user enumeration: if the user does not exist, still respond OK.
  if (error) {
    const msg = (error as any)?.message ? String((error as any).message) : String(error)
    if (msg.toLowerCase().includes('user') && msg.toLowerCase().includes('not')) {
      await logAuthEvent('PASSWORD_RESET_REQUEST', {
        ip: identifier,
        email,
        reason: 'user_not_found',
      })
      return Response.json({ ok: true })
    }
    return new Response(msg, { status: 400 })
  }

  const actionLink = data?.properties?.action_link
  if (!actionLink) return new Response('No action link generated', { status: 500 })

  const tpl = passwordRecoveryEmailTemplate({
    appName: 'ZIII Helpdesk',
    actionUrl: actionLink,
  })

  await sendMail({
    to: email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  })

  await logAuthEvent('PASSWORD_RESET_REQUEST', {
    ip: identifier,
    email,
    reason: 'link_sent',
  })

  return Response.json({ ok: true })
}
