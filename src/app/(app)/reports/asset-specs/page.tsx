import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AssetSpecsReportPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Usar cliente admin para que el reporte tenga visibilidad completa de activos
  const adminSupabase = createSupabaseAdminClient()

  // Obtener activos con especificaciones técnicas (solo PC y Laptops)
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
      asset_location:locations(code, name),
      assigned_user:profiles!assets_assigned_to_fkey(full_name, email)
    `)
    .in('asset_type', ['DESKTOP', 'LAPTOP'])
    .is('deleted_at', null)
    .order('asset_tag', { ascending: true })

  // Estadísticas
  const totalAssets = assets?.length ?? 0
  const withSpecs = assets?.filter(a => a.processor || a.ram_gb || a.storage_gb || a.os).length ?? 0
  const desktops = assets?.filter(a => a.asset_type === 'DESKTOP').length ?? 0
  const laptops = assets?.filter(a => a.asset_type === 'LAPTOP').length ?? 0

  // Agrupar por procesador más común
  const processorCounts = (assets ?? []).reduce((acc, a) => {
    if (a.processor) {
      const key = a.processor
      acc[key] = (acc[key] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
  const topProcessor = Object.entries(processorCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-md">
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
                <h1 className="text-xl font-bold text-white">Especificaciones Técnicas de Activos</h1>
                <p className="text-violet-100 text-sm">Inventario detallado de PCs y Laptops con hardware y software</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-gradient-to-br from-white to-violet-50">
          <div className="p-4">
            <div className="text-xs font-medium text-gray-600">Total PCs/Laptops</div>
            <div className="text-2xl font-bold text-violet-600 mt-1">{totalAssets}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              {desktops} PCs • {laptops} Laptops
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-white to-green-50">
          <div className="p-4">
            <div className="text-xs font-medium text-gray-600">Con Especificaciones</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{withSpecs}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              {Math.round((withSpecs / (totalAssets || 1)) * 100)}% del inventario
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-white to-blue-50">
          <div className="p-4">
            <div className="text-xs font-medium text-gray-600">Sin Especificar</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{totalAssets - withSpecs}</div>
            <div className="text-[10px] text-gray-500 mt-1">Pendientes de registro</div>
          </div>
        </div>
        {topProcessor && (
          <div className="card bg-gradient-to-br from-white to-amber-50">
            <div className="p-4">
              <div className="text-xs font-medium text-gray-600">Procesador más común</div>
              <div className="text-sm font-bold text-amber-700 mt-1 line-clamp-2">
                {topProcessor[0]}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">{topProcessor[1]} equipos</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de activos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th className="px-3 py-3 font-semibold text-xs">Activo</th>
                <th className="px-3 py-3 font-semibold text-xs">Procesador</th>
                <th className="px-3 py-3 font-semibold text-xs">RAM</th>
                <th className="px-3 py-3 font-semibold text-xs">Almacenamiento</th>
                <th className="px-3 py-3 font-semibold text-xs">Sistema Operativo</th>
                <th className="px-3 py-3 font-semibold text-xs">Ubicación</th>
                <th className="px-3 py-3 font-semibold text-xs">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(assets ?? []).map((asset) => {
                const location = asset.asset_location as any
                const assignedUser = asset.assigned_user as any
                const hasSpecs = asset.processor || asset.ram_gb || asset.storage_gb || asset.os
                
                return (
                  <tr key={asset.id} className={hasSpecs ? "hover:bg-gray-50" : "hover:bg-yellow-50 bg-yellow-50/30"}>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/assets/${asset.id}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-xl">
                            {asset.asset_type === 'LAPTOP' ? '💻' : '🖥️'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{asset.asset_tag}</div>
                            <div className="text-xs text-gray-600">
                              {asset.brand} {asset.model}
                            </div>
                            {asset.serial_number && (
                              <div className="text-[10px] text-gray-500 font-mono">
                                S/N: {asset.serial_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {asset.processor ? (
                        <div className="text-xs font-mono bg-slate-50 px-2 py-1 rounded max-w-[200px]">
                          {asset.processor}
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-semibold">⚠️ Sin especificar</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {asset.ram_gb ? (
                        <div className="text-sm">
                          <span className="font-bold text-gray-900">{asset.ram_gb}</span>
                          <span className="text-gray-600 ml-1">GB</span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {asset.storage_gb ? (
                        <div className="text-sm">
                          <span className="font-bold text-gray-900">{asset.storage_gb}</span>
                          <span className="text-gray-600 ml-1">GB</span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {asset.os ? (
                        <div className="text-xs font-mono bg-slate-50 px-2 py-1 rounded max-w-[150px]">
                          {asset.os}
                        </div>
                      ) : (
                        <span className="text-xs text-red-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {location ? (
                        <div className="text-xs">
                          <div className="font-semibold text-blue-700">{location.code}</div>
                          <div className="text-gray-600">{location.name}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin ubicación</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {assignedUser ? (
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900">{assignedUser.full_name}</div>
                          <div className="text-gray-600">{assignedUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin asignar</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {assets?.length === 0 && (
                <tr>
                  <td className="px-3 py-12 text-center text-gray-500" colSpan={7}>
                    <div className="text-4xl mb-2">💻</div>
                    <div className="font-medium">No hay equipos registrados</div>
                    <div className="text-xs mt-1">PCs y Laptops aparecerán aquí</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="card bg-violet-50 border-violet-200">
        <div className="p-4">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="font-semibold text-violet-900 text-sm mb-1">Importancia de las especificaciones</h3>
              <p className="text-xs text-violet-700 leading-relaxed">
                Mantener el inventario actualizado con especificaciones técnicas permite tomar decisiones informadas sobre 
                actualizaciones, reemplazos y optimización de recursos. Los equipos sin especificaciones (resaltados en amarillo) 
                deben ser completados para mantener un control preciso del hardware.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
