/**
 * Utilidades para manejo de ubicaciones/sedes multisede
 */

import { createSupabaseServerClient } from './server'

export type Location = {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  email: string | null
  manager_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Obtiene todas las ubicaciones activas
 */
export async function getAllLocations(): Promise<Location[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }
  
  return data as Location[]
}

/**
 * Obtiene la ubicación de un usuario específico
 */
export async function getUserLocation(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('location_id')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user location:', error)
    return null
  }
  
  return data?.location_id || null
}

/**
 * Verifica si el usuario es admin (puede ver todas las sedes)
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }
  
  return data?.role === 'admin'
}

/**
 * Obtiene el filtro de ubicación para queries
 * - Si es admin: null (sin filtro, ve todas las sedes)
 * - Si no es admin: location_id del usuario
 */
export async function getLocationFilter(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  // Verificar si es admin
  const admin = await isAdminUser(user.id)
  if (admin) return null // Admin ve todo
  
  // No admin: filtrar por su sede
  return await getUserLocation(user.id)
}

/**
 * Aplica el filtro de ubicación a una query de Supabase
 * Uso: await applyLocationFilter(supabase.from('tickets').select('*'))
 */
export async function applyLocationFilter<T>(
  query: any
): Promise<any> {
  const locationId = await getLocationFilter()
  
  if (locationId) {
    return query.eq('location_id', locationId)
  }
  
  return query
}

/**
 * Obtiene información detallada de una ubicación
 */
export async function getLocationById(locationId: string): Promise<Location | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single()
  
  if (error) {
    console.error('Error fetching location:', error)
    return null
  }
  
  return data as Location
}
