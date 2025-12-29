'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

const ASSET_TYPE_LABELS: Record<string, string> = {
  DESKTOP: 'Computadora de escritorio',
  LAPTOP: 'Laptop',
  PRINTER: 'Impresora',
  SCANNER: 'Escáner',
  MONITOR: 'Monitor',
  SERVER: 'Servidor',
  NETWORK_DEVICE: 'Equipo de red',
  PHONE: 'Teléfono',
  TABLET: 'Tablet',
  PROJECTOR: 'Proyector',
  OTHER: 'Otro',
}

const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Operacional',
  MAINTENANCE: 'En mantenimiento',
  OUT_OF_SERVICE: 'Fuera de servicio',
  RETIRED: 'Retirado',
}

const STATUS_COLORS: Record<string, string> = {
  OPERATIONAL: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800',
  RETIRED: 'bg-gray-100 text-gray-800',
}

type Asset = {
  id: string
  asset_tag: string
  asset_type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  location: string | null
  department: string | null
  status: string
  purchase_date: string | null
  warranty_end_date: string | null
  notes: string | null
  created_at: string
  created_by_profile: { full_name: string | null } | null
}

export default function AssetDetailView({ asset }: { asset: Asset }) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  const [formData, setFormData] = useState({
    asset_tag: asset.asset_tag,
    brand: asset.brand || '',
    model: asset.model || '',
    serial_number: asset.serial_number || '',
    location: asset.location || '',
    department: asset.department || '',
    status: asset.status,
    purchase_date: asset.purchase_date || '',
    warranty_end_date: asset.warranty_end_date || '',
    notes: asset.notes || '',
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleQuickStatusChange(newStatus: string) {
    if (!confirm(`¿Cambiar estado a "${STATUS_LABELS[newStatus]}"?`)) {
      return
    }

    setChangingStatus(true)

    const { error: updateError } = await supabase
      .from('assets')
      .update({ status: newStatus })
      .eq('id', asset.id)

    if (updateError) {
      alert('Error al actualizar: ' + updateError.message)
      setChangingStatus(false)
      return
    }

    setChangingStatus(false)
    router.refresh()
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    const { error: updateError } = await supabase
      .from('assets')
      .update({
        asset_tag: formData.asset_tag,
        brand: formData.brand || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        location: formData.location || null,
        department: formData.department || null,
        status: formData.status,
        purchase_date: formData.purchase_date || null,
        warranty_end_date: formData.warranty_end_date || null,
        notes: formData.notes || null,
      })
      .eq('id', asset.id)

    if (updateError) {
      setError(updateError.message)
      setBusy(false)
      return
    }

    setBusy(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de dar de baja este activo? El activo será marcado como eliminado pero se conservará en el historial.')) {
      return
    }

    setDeleting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: deleteError } = await supabase
      .from('assets')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null
      })
      .eq('id', asset.id)

    if (deleteError) {
      alert('Error al dar de baja: ' + deleteError.message)
      setDeleting(false)
      return
    }

    router.push('/admin/assets')
    router.refresh()
  }

  if (editing) {
    return (
      <form onSubmit={handleUpdate} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="card shadow-lg border-0">
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag de activo</label>
              <input
                type="text"
                className="input w-full"
                value={formData.asset_tag}
                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                className="select w-full"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
              <input
                type="text"
                className="input w-full"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
              <input
                type="text"
                className="input w-full"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Número de serie</label>
              <input
                type="text"
                className="input w-full"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
              <input
                type="text"
                className="input w-full"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
              <input
                type="text"
                className="input w-full"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de compra</label>
              <input
                type="date"
                className="input w-full"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fin de garantía</label>
              <input
                type="date"
                className="input w-full"
                value={formData.warranty_end_date}
                onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
              <textarea
                className="textarea w-full min-h-24"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn btn-secondary flex-1"
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={busy}
          >
            {busy ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card principal de información */}
      <div className="card shadow-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-xl shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-900">{ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}</h3>
                <p className="text-sm text-blue-700 font-mono">{asset.asset_tag}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${STATUS_COLORS[asset.status]}`}>
              {STATUS_LABELS[asset.status] || asset.status}
            </span>
          </div>
        </div>
        <div className="card-body p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tag
              </label>
              <p className="text-lg font-bold text-gray-900">{asset.asset_tag}</p>
            </div>

            {asset.brand && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Marca</label>
                <p className="text-lg text-gray-900">{asset.brand}</p>
              </div>
            )}

            {asset.model && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Modelo</label>
                <p className="text-lg text-gray-900">{asset.model}</p>
              </div>
            )}

            {asset.serial_number && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Número de serie</label>
                <p className="text-base text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">{asset.serial_number}</p>
              </div>
            )}

            {/* Ubicación y asignación */}
            {(asset.location || asset.department) && (
              <>
                {asset.location && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ubicación
                    </label>
                    <p className="text-lg text-gray-900">{asset.location}</p>
                  </div>
                )}

                {asset.department && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Departamento
                    </label>
                    <p className="text-lg text-gray-900">{asset.department}</p>
                  </div>
                )}
              </>
            )}

            {/* Fechas */}
            {(asset.purchase_date || asset.warranty_end_date) && (
              <>
                {asset.purchase_date && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Fecha de compra
                    </label>
                    <p className="text-base text-gray-900">{new Date(asset.purchase_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}

                {asset.warranty_end_date && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Fin de garantía
                    </label>
                    <p className="text-base text-gray-900">{new Date(asset.warranty_end_date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
              </>
            )}

            {/* Notas */}
            {asset.notes && (
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Notas
                </label>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">{asset.notes}</p>
              </div>
            )}

            {/* Información de auditoría */}
            <div className="md:col-span-2 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Creado el {new Date(asset.created_at).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {asset.created_by_profile?.full_name && ` por ${asset.created_by_profile.full_name}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas de estado */}
      {!editing && asset.status !== 'RETIRED' && (
        <div className="card shadow-sm border border-gray-200">
          <div className="card-body p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Cambiar estado rápido
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([status, label]) => {
                if (status === asset.status || status === 'RETIRED') return null
                return (
                  <button
                    key={status}
                    onClick={() => handleQuickStatusChange(status)}
                    disabled={changingStatus}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border-2 transition-all ${
                      STATUS_COLORS[status].replace('bg-', 'border-').replace('text-', 'hover:bg-').replace('-100', '-200').replace('-800', '-700')
                    } hover:shadow-md disabled:opacity-50`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setEditing(true)}
          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          disabled={changingStatus || deleting}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar información
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting || changingStatus}
          className="btn btn-danger flex-1 flex items-center justify-center gap-2"
        >
          {deleting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Eliminando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Dar de baja
            </>
          )}
        </button>
      </div>
    </div>
  )
}
