import { createSupabaseServerClient } from '@/lib/supabase/server'
import { rateLimit, getClientIdentifier } from '@/lib/security/rate-limit'
import {
  logAuthEvent,
  recordFailedLogin,
  clearFailedLogins,
  isAccountLocked,
  getFailedLoginCount,
} from '@/lib/security/audit'
import { emailSchema } from '@/lib/security/validation'

export async function POST(request: Request) {
  // Rate limiting: 5 login attempts per minute per IP
  const identifier = getClientIdentifier(request)
  const allowed = rateLimit(`login:${identifier}`, {
    maxRequests: 5,
    windowMs: 60 * 1000,
  })

  if (!allowed) {
    await logAuthEvent('RATE_LIMIT_EXCEEDED', {
      ip: identifier,
      endpoint: '/api/auth/login',
    })
    return Response.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate email
  const emailParse = emailSchema.safeParse((body as any)?.email)
  if (!emailParse.success) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 })
  }
  const email = emailParse.data

  const password = typeof (body as any)?.password === 'string' ? (body as any).password : ''
  if (!password) {
    return Response.json({ error: 'Password is required' }, { status: 400 })
  }

  // Check if account is locked
  if (isAccountLocked(email)) {
    const failedCount = getFailedLoginCount(email)
    await logAuthEvent('ACCOUNT_LOCKED', {
      ip: identifier,
      email,
      failedAttempts: failedCount,
    })
    return Response.json(
      { error: 'Cuenta bloqueada por múltiples intentos fallidos. Intenta de nuevo en 15 minutos.' },
      { status: 423 }
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Record failed login
    recordFailedLogin(email)
    const failedCount = getFailedLoginCount(email)

    await logAuthEvent('LOGIN_FAILED', {
      ip: identifier,
      email,
      reason: error.message,
      failedAttempts: failedCount,
    })

    // Don't leak specific error info to prevent enumeration
    return Response.json(
      { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
      { status: 401 }
    )
  }

  // Clear failed attempts on successful login
  clearFailedLogins(email)

  await logAuthEvent('LOGIN_SUCCESS', {
    ip: identifier,
    email,
  }, data.user?.id)

  return Response.json({ success: true, user: data.user })
}
