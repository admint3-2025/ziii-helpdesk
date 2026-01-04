import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import ChangePasswordForm from './ui/ChangePasswordForm'

export const metadata = {
  title: 'Mi Perfil | Helpdesk',
  description: 'Configuración de perfil y cambio de contraseña',
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, department, phone, building, floor, position, location_id, locations(name, code)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const roleLabels: Record<string, string> = {
    requester: 'Usuario',
    agent_l1: 'Técnico (Nivel 1)',
    agent_l2: 'Técnico (Nivel 2)',
    supervisor: 'Supervisor',
    auditor: 'Auditor',
    admin: 'Administrador',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
            {profile.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || 'Usuario'}</h1>
            <p className="text-blue-100 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Información del perfil */}
      <div className="card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del perfil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Rol
              </label>
              <p className="text-sm text-gray-900 font-medium">
                {roleLabels[profile.role] || profile.role}
              </p>
            </div>

            {profile.department && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Departamento
                </label>
                <p className="text-sm text-gray-900">{profile.department}</p>
              </div>
            )}

            {profile.position && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Puesto
                </label>
                <p className="text-sm text-gray-900">{profile.position}</p>
              </div>
            )}

            {profile.phone && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Teléfono / Ext
                </label>
                <p className="text-sm text-gray-900">{profile.phone}</p>
              </div>
            )}

            {(profile as any).locations && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Ciudad/Empresa
                </label>
                <p className="text-sm text-gray-900">
                  {(profile as any).locations.name} ({(profile as any).locations.code})
                </p>
              </div>
            )}

            {profile.building && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Edificio / Sede
                </label>
                <p className="text-sm text-gray-900">{profile.building}</p>
              </div>
            )}

            {profile.floor && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Piso
                </label>
                <p className="text-sm text-gray-900">{profile.floor}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cambio de contraseña */}
      <ChangePasswordForm />
    </div>
  )
}
