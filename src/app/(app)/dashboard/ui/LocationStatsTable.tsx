"use client"

import { useMemo, useState } from "react"

type LocationStatsRow = {
  location_id: string
  location_code: string
  location_name: string
  total_tickets: number
  open_tickets: number
  closed_tickets: number
  avg_resolution_days: number
}

export default function LocationStatsTable({ rows }: { rows: LocationStatsRow[] }) {
  if (!rows || rows.length === 0) {
    return null
  }

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    rows[0]?.location_id ?? null
  )

  const maxTotalTickets = useMemo(
    () => rows.reduce((max, r) => (r.total_tickets > max ? r.total_tickets : max), 0) || 1,
    [rows]
  )

  const selected = useMemo(
    () => rows.find((r) => r.location_id === selectedLocationId) ?? rows[0],
    [rows, selectedLocationId]
  )

  const openPct = selected.total_tickets
    ? Math.round((selected.open_tickets / selected.total_tickets) * 100)
    : 0
  const closedPct = selected.total_tickets
    ? Math.round((selected.closed_tickets / selected.total_tickets) * 100)
    : 0
  const otherPct = Math.max(0, 100 - openPct - closedPct)

  const [sending, setSending] = useState(false)
  const [sendMessage, setSendMessage] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [includeResponsables, setIncludeResponsables] = useState(true)
  const [extraEmails, setExtraEmails] = useState('')

  async function handleSendSummary() {
    if (!selected.location_id || sending) return
    setSending(true)
    setSendMessage(null)
    try {
      const additionalEmails = extraEmails
        .split(',')
        .map((e) => e.trim())
        .filter((e) => !!e)

      const res = await fetch('/api/reports/location-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: selected.location_id,
          includeLocationRecipients: includeResponsables,
          additionalEmails,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSendMessage(
          data?.error || 'No se pudo enviar el resumen por correo. Intenta nuevamente o contacta a IT.'
        )
        return
      }

      setSendMessage('Resumen enviado por correo a los destinatarios seleccionados.')
      setShowModal(false)
      setExtraEmails('')
      setIncludeResponsables(true)
    } catch (error) {
      console.error('Error enviando resumen por sede:', error)
      setSendMessage('Ocurrió un error al enviar el resumen por correo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card shadow-lg border-0">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 rounded-lg">
              <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h18M3 10h18M3 15h18M3 20h18"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Estadísticas por sede</h3>
              <p className="text-xs text-gray-600">
                Haz clic en una sede para ver su detalle de incidencias
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Tabla interactiva de sedes */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-3">Sede</th>
                  <th className="py-2 px-3 text-right">Tickets</th>
                  <th className="py-2 px-3 text-right">Abiertos</th>
                  <th className="py-2 px-3 text-right">Cerrados</th>
                  <th className="py-2 pl-3 text-right">Prom. resolución (días)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSelected = row.location_id === selectedLocationId
                  const barWidth = `${(row.total_tickets / maxTotalTickets) * 100}%`
                  return (
                    <tr
                      key={row.location_id}
                      className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors hover:bg-sky-50 ${
                        isSelected ? "bg-sky-50" : "bg-white"
                      }`}
                      onClick={() => setSelectedLocationId(row.location_id)}
                    >
                      <td className="py-1.5 pr-3 align-middle">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-sky-700">[{row.location_code}]</span>
                          <span className="text-xs text-gray-900 truncate">{row.location_name}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-right text-xs text-gray-900 font-medium">{row.total_tickets}</td>
                      <td className="py-1.5 px-3 text-right text-xs text-amber-700 font-medium">{row.open_tickets}</td>
                      <td className="py-1.5 px-3 text-right text-xs text-emerald-700 font-medium">{row.closed_tickets}</td>
                      <td className="py-1.5 pl-3 text-right text-xs text-gray-900 font-medium">
                        {row.avg_resolution_days?.toFixed
                          ? row.avg_resolution_days.toFixed(1)
                          : row.avg_resolution_days}
                      </td>
                      <td className="hidden xl:table-cell w-24 pl-3">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-sky-400 rounded-full"
                            style={{ width: barWidth }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Panel de detalle de la sede seleccionada */}
          <div className="border border-sky-100 rounded-xl p-3 bg-sky-50/60 flex flex-col gap-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-sky-700 mb-0.5">Sede seleccionada</p>
                <p className="text-sm font-semibold text-gray-900">
                  [{selected.location_code}] {selected.location_name}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-sky-700 border border-sky-100">
                {selected.total_tickets} tickets
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white border border-gray-100 px-2 py-1.5">
                <p className="text-[10px] text-gray-500">Abiertos</p>
                <p className="text-sm font-semibold text-amber-700">{selected.open_tickets}</p>
                <p className="text-[10px] text-amber-600">{openPct}%</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 px-2 py-1.5">
                <p className="text-[10px] text-gray-500">Cerrados</p>
                <p className="text-sm font-semibold text-emerald-700">{selected.closed_tickets}</p>
                <p className="text-[10px] text-emerald-600">{closedPct}%</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-100 px-2 py-1.5">
                <p className="text-[10px] text-gray-500">Prom. resolución</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selected.avg_resolution_days?.toFixed
                    ? selected.avg_resolution_days.toFixed(1)
                    : selected.avg_resolution_days}{" "}
                  d
                </p>
                <p className="text-[10px] text-gray-500">días</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Distribución de tickets</p>
              <div className="h-2 w-full rounded-full bg-white border border-gray-100 overflow-hidden flex">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${openPct}%` }}
                  title={`${openPct}% abiertos`}
                ></div>
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${closedPct}%` }}
                  title={`${closedPct}% cerrados`}
                ></div>
                {otherPct > 0 && (
                  <div
                    className="h-full bg-sky-300"
                    style={{ width: `${otherPct}%` }}
                    title={`${otherPct}% otros estados`}
                  ></div>
                )}
              </div>
              <p className="text-[10px] text-gray-500">
                {openPct > 0
                  ? `${openPct}% de los tickets están abiertos en esta sede`
                  : "No hay tickets abiertos actualmente en esta sede"}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
                >
                  Generar y revisar resumen
                </button>
                {sendMessage && (
                  <p className="text-[10px] text-gray-600">
                    {sendMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 text-xs">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-2.5 flex items-center justify-between bg-slate-50">
              <div>
                <p className="text-[10px] font-semibold text-sky-700 uppercase tracking-wide">Resumen por sede</p>
                <p className="text-xs font-semibold text-gray-900">
                  [{selected.location_code}] {selected.location_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1.5">
                  <p className="text-[10px] text-slate-500">Tickets totales</p>
                  <p className="text-sm font-semibold text-slate-900">{selected.total_tickets}</p>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5">
                  <p className="text-[10px] text-amber-700">Abiertos</p>
                  <p className="text-sm font-semibold text-amber-700">{selected.open_tickets}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5">
                  <p className="text-[10px] text-emerald-700">Cerrados</p>
                  <p className="text-sm font-semibold text-emerald-700">{selected.closed_tickets}</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <p className="text-[10px] text-slate-500">Promedio de resolución</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selected.avg_resolution_days?.toFixed
                    ? selected.avg_resolution_days.toFixed(1)
                    : selected.avg_resolution_days}{' '}
                  días
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Destinatarios del resumen
                </p>
                <label className="flex items-start gap-2 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3 w-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    checked={includeResponsables}
                    onChange={(e) => setIncludeResponsables(e.target.checked)}
                  />
                  <span>
                    Enviar automáticamente a responsables de la sede (supervisores / administradores con acceso a esta
                    ubicación).
                  </span>
                </label>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-600">Correos adicionales (separados por coma)</p>
                  <input
                    type="text"
                    value={extraEmails}
                    onChange={(e) => setExtraEmails(e.target.value)}
                    placeholder="ej: gerente@empresa.com, director@empresa.com"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-slate-500">
                  Se generará un resumen ejecutivo con KPIs y listado de tickets abiertos más relevantes de esta sede.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSendSummary}
                    disabled={sending}
                    className="rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Enviando…' : 'Enviar resumen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
