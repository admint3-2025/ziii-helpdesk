import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { updateUserSchema } from '@/lib/security/validation'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

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
  const validation = updateUserSchema.safeParse(body)
  if (!validation.success) {
    const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    return new Response(`Validation error: ${errors}`, { status: 400 })
  }

  const validatedData = validation.data
  const admin = createSupabaseAdminClient()

  const updates: Record<string, any> = {}

  if (validatedData.full_name !== undefined) {
    updates.full_name = validatedData.full_name || null

    // Keep metadata roughly in sync
    await admin.auth.admin.updateUserById(id, {
      user_metadata: validatedData.full_name ? { full_name: validatedData.full_name } : {},
    })
  }

  if (validatedData.role !== undefined) {
    updates.role = validatedData.role
  }

  if (validatedData.department !== undefined) {
    updates.department = validatedData.department || null
  }

  if (validatedData.phone !== undefined) {
    updates.phone = validatedData.phone || null
  }

  if (validatedData.building !== undefined) {
    updates.building = validatedData.building || null
  }

  if (validatedData.floor !== undefined) {
    updates.floor = validatedData.floor || null
  }

  if (validatedData.position !== undefined) {
    updates.position = validatedData.position || null
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('profiles').update(updates).eq('id', id)
    if (error) return new Response(error.message, { status: 400 })
  }

  if (validatedData.active !== undefined) {
    const ban_duration: string | 'none' = validatedData.active ? 'none' : '876000h'
    const { error } = await admin.auth.admin.updateUserById(id, { ban_duration })
    if (error) return new Response(error.message, { status: 400 })
  }

  await admin.from('audit_log').insert({
    entity_type: 'user',
    entity_id: id,
    action: 'UPDATE',
    actor_id: user.id,
    metadata: {
      updates: validatedData,
    },
  })

  return new Response('OK')
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const admin = createSupabaseAdminClient()

  // Soft delete keeps records around in Auth for traceability
  const { error } = await admin.auth.admin.deleteUser(id, true)
  if (error) return new Response(error.message, { status: 400 })

  await admin.from('audit_log').insert({
    entity_type: 'user',
    entity_id: id,
    action: 'DELETE',
    actor_id: user.id,
    metadata: {
      soft_delete: true,
    },
  })

  return new Response('OK')
}
