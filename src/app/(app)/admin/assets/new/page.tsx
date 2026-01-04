import AssetCreateForm from './ui/AssetCreateForm'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function NewAssetPage() {
  const supabase = await createSupabaseServerClient()
  
  // Obtener sedes activas
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Activo</h1>
        <p className="text-sm text-gray-600 mt-1">Registra un nuevo activo en el inventario</p>
      </div>

      <AssetCreateForm locations={locations || []} />
    </div>
  )
}
