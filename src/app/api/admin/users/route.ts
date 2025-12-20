import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIdentifier } from '@/lib/security/rate-limit'
import { createUserSchema, passwordSchema } from '@/lib/security/validation'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const admin = createSupabaseAdminClient()

  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listErr) return new Response(listErr.message, { status: 500 })

  const authUsers = listed.users ?? []
  const ids = authUsers.map((u) => u.id)

  const { data: profiles, error: profErr } = await admin
    .from('profiles')
    .select('id,full_name,role,department,phone,building,floor,position,supervisor_id')
    .in('id', ids)

  if (profErr) return new Response(profErr.message, { status: 500 })

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const users = authUsers.map((u) => {
    const p = profileMap.get(u.id) as any
    return {
      id: u.id,
      email: (u as any).email ?? null,
      created_at: (u as any).created_at ?? null,
      last_sign_in_at: (u as any).last_sign_in_at ?? null,
      banned_until: (u as any).banned_until ?? null,
      role: (p?.role as any) ?? null,
      full_name: (p?.full_name as any) ?? null,
      department: (p?.department as any) ?? null,
      phone: (p?.phone as any) ?? null,
      building: (p?.building as any) ?? null,
      floor: (p?.floor as any) ?? null,
      position: (p?.position as any) ?? null,
      supervisor_id: (p?.supervisor_id as any) ?? null,
    }
  })

  return Response.json({ users })
}

export async function POST(request: Request) {
  // Rate limiting: 10 user creations per hour per IP
  const identifier = getClientIdentifier(request)
  const allowed = rateLimit(`admin-create-user:${identifier}`, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  })

  if (!allowed) {
    return new Response('Too many user creation requests. Please try again later.', { status: 429 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Validate with Zod
  const validation = createUserSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
    return new Response(`Validation error: ${errors}`, { status: 400 })
  }

  const validatedData = validation.data
  const invite = validatedData.invite !== false

  // If not inviting, validate password strength
  if (!invite) {
    if (!validatedData.password) {
      return new Response('Password requerido cuando no se envía invitación.', { status: 400 })
    }
    
    const passwordValidation = passwordSchema.safeParse(validatedData.password)
    if (!passwordValidation.success) {
      const errors = passwordValidation.error.errors.map((e: any) => e.message).join(', ')
      return new Response(errors, { status: 400 })
    }
  }

  const admin = createSupabaseAdminClient()

  // Create user in Auth (invite by default)
  const created = invite
    ? await admin.auth.admin.inviteUserByEmail(validatedData.email, {
        data: validatedData.full_name ? { full_name: validatedData.full_name } : undefined,
      })
    : await admin.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password ?? undefined,
        email_confirm: true,
        user_metadata: validatedData.full_name ? { full_name: validatedData.full_name } : undefined,
      })

  if (created.error || !created.data.user) {
    return new Response(created.error?.message ?? 'Failed to create user', { status: 400 })
  }

  const newUserId = created.data.user.id

  // Ensure profile exists with proper role
  const { error: upsertErr } = await admin.from('profiles').upsert({
    id: newUserId,
    full_name: validatedData.full_name || null,
    role: validatedData.role,
    department: validatedData.department || null,
    phone: validatedData.phone || null,
    building: validatedData.building || null,
    floor: validatedData.floor || null,
    position: validatedData.position || null,
  })

  if (upsertErr) {
    return new Response(`User created, but profile update failed: ${upsertErr.message}`, { status: 500 })
  }

  // Best-effort audit (won't block)
  await admin.from('audit_log').insert({
    entity_type: 'user',
    entity_id: newUserId,
    action: 'CREATE',
    actor_id: user.id,
    metadata: {
      email: validatedData.email,
      role: validatedData.role,
      department: validatedData.department,
      invite,
    },
  })

  return Response.json({
    id: newUserId,
    email: validatedData.email,
    role: validatedData.role,
    invite,
  })
}
