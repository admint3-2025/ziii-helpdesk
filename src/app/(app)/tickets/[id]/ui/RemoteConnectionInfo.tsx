'use client'

import { useState } from 'react'

type RemoteConnectionInfoProps = {
  type: string
  id: string | null
  password: string | null
}

export default function RemoteConnectionInfo({ type, id, password }: RemoteConnectionInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'rustdesk': return '🖥️ RustDesk'
      case 'anydesk': return '🔵 AnyDesk'
      case 'teamviewer': return '🔴 TeamViewer'
      case 'chrome_remote': return '🌐 Chrome Remote Desktop'
      case 'otros': return '⚙️ Otros'
      default: return type
    }
  }

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
      <div className="text-xs font-semibold text-cyan-700 uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Conexión Remota
      </div>
      
      <div className="space-y-3">
        {/* Tipo */}
        <div>
          <div className="text-xs text-cyan-600 font-medium mb-1">Tipo:</div>
          <div className="text-sm font-semibold text-cyan-900">
            {getTypeLabel()}
          </div>
        </div>

        {/* ID de conexión */}
        {id && (
          <div>
            <div className="text-xs text-cyan-600 font-medium mb-1">ID de conexión:</div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-cyan-300">
              <code className="text-sm font-mono font-bold text-cyan-900 flex-1">
                {id}
              </code>
              <button
                onClick={() => copyToClipboard(id, 'id')}
                className="flex-shrink-0 p-1.5 hover:bg-cyan-100 rounded transition-colors"
                title={copiedField === 'id' ? '¡Copiado!' : 'Copiar ID'}
              >
                {copiedField === 'id' ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Password */}
        {password && (
          <div>
            <div className="text-xs text-cyan-600 font-medium mb-1">Password:</div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-cyan-300">
              <code className="text-sm font-mono font-bold text-cyan-900 flex-1">
                {password}
              </code>
              <button
                onClick={() => copyToClipboard(password, 'password')}
                className="flex-shrink-0 p-1.5 hover:bg-cyan-100 rounded transition-colors"
                title={copiedField === 'password' ? '¡Copiado!' : 'Copiar password'}
              >
                {copiedField === 'password' ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 bg-cyan-100/50 rounded-lg p-2">
        <svg className="w-4 h-4 text-cyan-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-cyan-800">
          Usa esta información para conectarte de forma remota al equipo del usuario
        </p>
      </div>
    </div>
  )
}
