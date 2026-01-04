'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type Department = {
  id: string
  name: string
  code: string | null
}

type DepartmentSelectorProps = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  allowCreate?: boolean
}

export default function DepartmentSelector({
  value,
  onChange,
  required = false,
  placeholder = 'Selecciona un departamento',
  allowCreate = true,
}: DepartmentSelectorProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptCode, setNewDeptCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDepartments()
  }, [])

  async function loadDepartments() {
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase
      .from('departments')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name')
    
    setDepartments(data ?? [])
    setLoading(false)
  }

  async function createDepartment() {
    if (!newDeptName.trim()) return

    setIsCreating(true)
    const supabase = createSupabaseBrowserClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: newDeptName.trim(),
        code: newDeptCode.trim() || null,
        is_active: true,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      alert(`Error al crear departamento: ${error.message}`)
      setIsCreating(false)
      return
    }

    // Registrar en auditoría
    await supabase.from('audit_log').insert({
      entity_type: 'department',
      entity_id: data.id,
      action: 'CREATE',
      actor_id: user?.id,
      metadata: {
        name: data.name,
        code: data.code,
      },
    })

    // Actualizar lista y seleccionar el nuevo
    await loadDepartments()
    onChange(data.name)
    setShowCreateModal(false)
    setNewDeptName('')
    setNewDeptCode('')
    setIsCreating(false)
  }

  if (loading) {
    return (
      <select
        disabled
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
      >
        <option>Cargando departamentos...</option>
      </select>
    )
  }

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
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.code ? `${dept.code} - ${dept.name}` : dept.name}
            </option>
          ))}
          {allowCreate && (
            <option value="__CREATE_NEW__" className="font-semibold text-blue-600">
              + Crear nuevo departamento
            </option>
          )}
        </select>
      </div>

      {/* Modal para crear departamento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Departamento</h3>
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
                  Nombre del Departamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Ej: Tecnología, Innovación..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Código (Opcional)
                </label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  placeholder="Ej: TEC, INNO..."
                  maxLength={10}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Código corto para identificar el departamento</p>
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
                  onClick={createDepartment}
                  disabled={!newDeptName.trim() || isCreating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? 'Creando...' : 'Crear Departamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
