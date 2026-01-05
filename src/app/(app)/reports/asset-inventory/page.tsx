import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getReportsLocationFilter } from '@/lib/supabase/reports-filter'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AssetInventoryClient from './AssetInventoryClient'

export default async function AssetInventoryReportPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; type?: string; status?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const params = await searchParams

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, location_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Obtener filtro de ubicaciones para reportes
  const locationFilter = await getReportsLocationFilter()

  const adminSupabase = createSupabaseAdminClient()

  // Obtener todas las sedes activas (o filtradas para supervisores sin permiso especial)
  let locationsQuery = adminSupabase
    .from('locations')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  // Si el supervisor no tiene acceso total, solo mostrar sus sedes en el dropdown
  if (locationFilter.shouldFilter && locationFilter.locationIds.length > 0) {
    locationsQuery = locationsQuery.in('id', locationFilter.locationIds)
  } else if (locationFilter.shouldFilter && locationFilter.locationIds.length === 0) {
    // Supervisor sin sedes: no mostrar opciones
    locationsQuery = locationsQuery.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: locations } = await locationsQuery

  // Construir query de activos
  let query = adminSupabase
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
      purchase_date,
      warranty_end_date,
      notes,
      assigned_to,
      created_at,
      locations!assets_location_id_fkey(id, code, name)
    `)
    .is('deleted_at', null)
    .order('asset_tag', { ascending: true })

  // Aplicar filtro de ubicación para supervisores sin permiso especial (ANTES de otros filtros)
  if (locationFilter.shouldFilter && locationFilter.locationIds.length > 0) {
    query = query.in('location_id', locationFilter.locationIds)
  } else if (locationFilter.shouldFilter && locationFilter.locationIds.length === 0) {
    // Supervisor sin sedes: no mostrar nada
    query = query.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  // Aplicar filtros del usuario (parámetros de búsqueda)
  if (params.location) {
    query = query.eq('location_id', params.location)
  }

  if (params.type) {
    query = query.eq('asset_type', params.type)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: assets, error: assetsError } = await query

  // Debug logs
  if (assetsError) {
    console.error('[asset-inventory] Error fetching assets:', assetsError)
  }
  console.log('[asset-inventory] Assets count:', assets?.length ?? 0)
  console.log('[asset-inventory] Locations count:', locations?.length ?? 0)

  // Obtener información de usuarios asignados
  const assignedUserIds = [...new Set((assets ?? []).map(a => a.assigned_to).filter(Boolean))]
  let assignedUsersMap = new Map()
  
  if (assignedUserIds.length > 0) {
    const { data: assignedUsers } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', assignedUserIds)
    
    assignedUsersMap = new Map((assignedUsers ?? []).map(u => [u.id, u]))
  }

  // Mapear assets con información completa
  const enrichedAssets = (assets ?? []).map(asset => ({
    ...asset,
    asset_location: (asset as any).locations,
    assigned_user: asset.assigned_to ? assignedUsersMap.get(asset.assigned_to) : null,
  }))

  // Estadísticas generales
  const totalAssets = enrichedAssets.length
  const byLocation = enrichedAssets.reduce((acc, asset) => {
    const locId = asset.location_id || 'sin-sede'
    const locName = asset.asset_location?.name || 'Sin sede asignada'
    if (!acc[locId]) {
      acc[locId] = { name: locName, count: 0 }
    }
    acc[locId].count++
    return acc
  }, {} as Record<string, { name: string; count: number }>)

  const byType = enrichedAssets.reduce((acc, asset) => {
    const type = asset.asset_type || 'OTHER'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byStatus = enrichedAssets.reduce((acc, asset) => {
    const status = asset.status || 'OPERATIONAL'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Tipos de activos legibles
  const assetTypeLabels: Record<string, string> = {
    DESKTOP: 'PC de Escritorio',
    LAPTOP: 'Laptop',
    PRINTER: 'Impresora',
    SCANNER: 'Escáner',
    MONITOR: 'Monitor',
    PHONE: 'Teléfono',
    TABLET: 'Tablet',
    SERVER: 'Servidor',
    NETWORK_DEVICE: 'Equipo de Red',
    PERIPHERAL: 'Periférico',
    OTHER: 'Otro',
  }

  const statusLabels: Record<string, string> = {
    OPERATIONAL: 'Operacional',
    MAINTENANCE: 'En Mantenimiento',
    OUT_OF_SERVICE: 'Fuera de Servicio',
    RETIRED: 'Retirado',
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="relative z-10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/reports"
                className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Inventario de Activos</h1>
                <p className="text-cyan-100 text-sm">Catálogo completo con filtros por sede, tipo y estado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-gradient-to-br from-white to-cyan-50">
          <div className="p-4">
            <div className="text-xs font-medium text-gray-600">Total de Activos</div>
            <div className="text-2xl font-bold text-cyan-600 mt-1">{totalAssets}</div>
            <div className="text-[10px] text-gray-500 mt-1">En inventario activo</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-white to-green-50">
          <div className="p-4">
            <div className="text-xs font-medium text-gray-600">Operacionales</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{byStatus.OPERATIONAL ?? 0}</div>
            <div className="text-[10px] text-gray-500 mt-1">En uso activo</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-white to-amber-50">
          <div className="p-4">
            <div className="text-xs font-medium text-gray-600">En Mantenimiento</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{byStatus.MAINTENANCE ?? 0}</div>
            <div className="text-[10px] text-gray-500 mt-1">Requieren atención</div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-white to-blue-50">
          <div className="p-4">
            <div className="text-xs font-medium text-gray-600">Sedes con Activos</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{Object.keys(byLocation).length}</div>
            <div className="text-[10px] text-gray-500 mt-1">Ubicaciones activas</div>
          </div>
        </div>
      </div>

      {/* Componente cliente con filtros interactivos */}
      <AssetInventoryClient
        locations={locations ?? []}
        assets={enrichedAssets}
        assetTypeLabels={assetTypeLabels}
        statusLabels={statusLabels}
        initialFilters={{
          location: params.location,
          type: params.type,
          status: params.status,
        }}
      />

      {/* Distribución por sede */}
      {Object.keys(byLocation).length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Distribución por Sede</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(byLocation)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([locId, { name, count }]) => (
                  <div key={locId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{name}</div>
                        <div className="text-xs text-gray-600">{count} activos</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{count}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Nota informativa */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex gap-3">
            <div className="text-2xl">📊</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 text-sm mb-1">Sobre este reporte</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Este reporte muestra el inventario completo de activos con opciones de filtrado por sede, tipo y estado. 
                Puedes exportar los resultados a Excel o PDF para análisis detallado y presentaciones. Los datos se actualizan en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
