'use client'

import { useState } from 'react'

type Result = {
  id: string
  name: string
  code: string
}

export default function LocationCreateForm() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('México')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [managerName, setManagerName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  async function submit() {
    setError(null)
    setResult(null)

    if (!name.trim()) {
      setError('Nombre requerido')
      return
    }

    if (!code.trim()) {
      setError('Código requerido (ej: MTY, CDMX)')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          manager_name: managerName.trim(),
        }),
      })

      const text = await res.text()
      if (!res.ok) {
        setError(text || `Error ${res.status}`)
        return
      }

      const json = JSON.parse(text) as Result
      setResult(json)
      setName('')
      setCode('')
      setCity('')
      setState('')
      setCountry('México')
      setAddress('')
      setPhone('')
      setEmail('')
      setManagerName('')
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="p-4 space-y-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Crear ubicación</div>
          <div className="text-[11px] text-gray-600 mt-0.5">
            Registra ciudades o empresas para segmentar tickets y reportes.
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-medium text-gray-700">Nombre *</label>
            <input
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sede Central Monterrey"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">Código *</label>
            <input
              className="input mt-1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MTY, CDMX, GDL..."
              autoComplete="off"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">Ciudad</label>
            <input
              className="input mt-1"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Monterrey"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">Estado</label>
            <input
              className="input mt-1"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Nuevo León"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">País</label>
            <input
              className="input mt-1"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="México"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">Teléfono</label>
            <input
              className="input mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 81 1234 5678"
              autoComplete="off"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-gray-700">Dirección</label>
            <input
              className="input mt-1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Principal #123, Col. Centro"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">Email de contacto</label>
            <input
              className="input mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@empresa.com"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">Responsable</label>
            <input
              className="input mt-1"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Gerente de Sede"
              autoComplete="off"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700">{error}</div>
        ) : null}

        {result ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-2.5 py-2 text-xs text-green-800">
            Ubicación creada: <span className="font-semibold">{result.name}</span> ({result.code})
          </div>
        ) : null}

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'Procesando…' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
