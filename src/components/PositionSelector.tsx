'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type Position = {
  id: string
  name: string
  category: string | null
}

type PositionSelectorProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  allowCreate?: boolean
}

export default function PositionSelector({
  value,
  onChange,
  required = false,
  placeholder = 'Selecciona un puesto',
  allowCreate = true,
}: PositionSelectorProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPositionName, setNewPositionName] = useState('')
  const [newPositionCategory, setNewPositionCategory] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPositions()
  }, [])

  async function loadPositions() {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from('job_positions')
      .select('id, name, category')
      .eq('is_active', true)
      .order('name')
    
    setPositions(data ?? [])
    setLoading(false)
  }

  async function createPosition() {
    if (!newPositionName.trim()) return

    setIsCreating(true)
    const supabase = createSupabaseBrowserClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('job_positions')
      .insert({
        name: newPositionName.trim(),
        category: newPositionCategory.trim() || null,
        is_active: true,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      alert(`Error al crear puesto: ${error.message}`)
      setIsCreating(false)
      return
    }

    // Registrar en auditoría
    await supabase.from('audit_log').insert({
      entity_type: 'job_position',
      entity_id: data.id,
      action: 'CREATE',
      actor_id: user?.id,
      metadata: {
        name: data.name,
        category: data.category,
      },
    })

    // Actualizar lista y seleccionar el nuevo
    await loadPositions()
    onChange(data.name)
    setShowCreateModal(false)
    setNewPositionName('')
    setNewPositionCategory('')
    setIsCreating(false)
  }

  if (loading) {
    return (
      <select
        disabled
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
      >
        <option>Cargando puestos...</option>
      </select>
    )
  }

  // Agrupar puestos por categoría
  const categorizedPositions = positions.reduce((acc, position) => {
    const cat = position.category || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(position)
    return acc
  }, {} as Record<string, Position[]>)

  return (
    <>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === '__CREATE_NEW__') {
              setShowCreateModal(true)
            } else {
              onChange(e.target.value)
            }
          }}
          required={required}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{placeholder}</option>
          {Object.entries(categorizedPositions).sort().map(([category, categoryPositions]) => (
            <optgroup key={category} label={category}>
              {categoryPositions.map((position) => (
                <option key={position.id} value={position.name}>
                  {position.name}
                </option>
              ))}
            </optgroup>
          ))}
          {allowCreate && (
            <option value="__CREATE_NEW__" className="font-semibold text-blue-600">
              + Crear nuevo puesto
            </option>
          )}
        </select>
      </div>

      {/* Modal para crear puesto */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Puesto</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre del Puesto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="Ej: Analista de Datos, Gerente..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Categoría (Opcional)
                </label>
                <select
                  value={newPositionCategory}
                  onChange={(e) => setNewPositionCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Ventas">Ventas</option>
                  <option value="Marketing">Marketing</option>
                  <option value="IT">IT</option>
                  <option value="RRHH">RRHH</option>
                  <option value="Administración">Administración</option>
                  <option value="Finanzas">Finanzas</option>
                  <option value="Compras">Compras</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Área o departamento del puesto</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isCreating}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={createPosition}
                  disabled={!newPositionName.trim() || isCreating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Creando...' : 'Crear Puesto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
