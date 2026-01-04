import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Devuelve la lista de usuarios notificables (admins y supervisores)
// usando la función SQL get_notifiable_users_with_locations()
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.rpc('get_notifiable_users_with_locations')

    if (error) {
      console.error('Error RPC get_notifiable_users_with_locations:', error)
      return NextResponse.json({ error: 'Error al obtener usuarios notificables' }, { status: 500 })
    }

    const users = (data || []).map((u: any) => ({
      id: u.user_id,
      name: u.full_name || u.email,
      email: u.email,
      role: u.role,
      location: u.location_codes,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error en /api/users/notifiable:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
