import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { toCsv } from '@/lib/reports/csv'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    return new Response('Forbidden', { status: 403 })
  }

  const adminSupabase = createSupabaseAdminClient()

  // Obtener activos
  const { data: assets } = await adminSupabase
    .from('assets')
    .select(`
      id,
      asset_tag,
      asset_type,
      status,
      brand,
      model,
      serial_number,
      processor,
      ram_gb,
      storage_gb,
      os,
      location_id,
      department,
      assigned_to,
      purchase_date,
      locations!assets_location_id_fkey(code, name)
    `)
    .in('asset_type', ['DESKTOP', 'LAPTOP'])
    .is('deleted_at', null)
    .order('asset_tag', { ascending: true })

  // Obtener usuarios asignados
  const assignedUserIds = [...new Set((assets ?? []).map(a => a.assigned_to).filter(Boolean))]
  const { data: assignedProfiles } = assignedUserIds.length > 0 
    ? await adminSupabase
        .from('profiles')
        .select('id, full_name')
        .in('id', assignedUserIds)
    : { data: [] }

  // Obtener emails de auth.users
  const { data: authData } = assignedUserIds.length > 0
    ? await adminSupabase.auth.admin.listUsers()
    : { data: { users: [] } }

  const emailMap = new Map(
    authData?.users?.map(u => [u.id, u.email]) ?? []
  )

  // Combinar datos de profiles y auth
  const assignedUsers = (assignedProfiles ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: emailMap.get(p.id) || 'Sin email'
  }))

  const userMap = new Map(assignedUsers.map(u => [u.id, u]))

  const headers = [
    'Tag del Activo',
    'Tipo',
    'Marca',
    'Modelo',
    'Número de Serie',
    'Procesador',
    'RAM (GB)',
    'Almacenamiento (GB)',
    'Sistema Operativo',
    'Estado',
    'Ubicación - Código',
    'Ubicación - Nombre',
    'Departamento',
    'Asignado a',
    'Email',
    'Fecha de Compra',
  ]

  const rows = (assets ?? []).map((asset) => {
    const location = (asset.locations as any) || null
    const assignedUser = asset.assigned_to ? userMap.get(asset.assigned_to) : null
    const assetType = asset.asset_type === 'DESKTOP' ? 'PC de Escritorio' : 'Laptop'
    const status = asset.status === 'OPERATIONAL' ? 'Operacional' 
      : asset.status === 'MAINTENANCE' ? 'En Mantenimiento'
      : asset.status === 'OUT_OF_SERVICE' ? 'Fuera de Servicio'
      : asset.status === 'RETIRED' ? 'Retirado'
      : asset.status

    return [
      asset.asset_tag || '',
      assetType,
      asset.brand || '',
      asset.model || '',
      asset.serial_number || '',
      asset.processor || '',
      asset.ram_gb?.toString() || '',
      asset.storage_gb?.toString() || '',
      asset.os || '',
      status,
      location?.code || '',
      location?.name || '',
      asset.department || '',
      assignedUser?.full_name || '',
      assignedUser?.email || '',
      asset.purchase_date || '',
    ]
  })

  const csvBody = toCsv(headers, rows)
  const bom = '\uFEFF'
  const nowDate = new Date().toISOString().slice(0, 10)
  const filename = `especificaciones-activos-${nowDate}.csv`

  // Registrar en auditoría
  await adminSupabase.from('audit_log').insert({
    entity_type: 'report',
    entity_id: user.id,
    action: 'EXPORT',
    actor_id: user.id,
    metadata: {
      report: 'asset-specs',
      row_count: rows.length,
    },
  })

  return new Response(bom + csvBody, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
