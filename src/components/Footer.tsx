import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo y descripción */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://integracional3.com.mx/logorigen/ZIII%20logo.png"
                alt="ZIII Logo"
                className="h-12 w-auto"
              />
              <div>
                <div className="text-sm font-bold text-gray-900 font-[family-name:var(--font-orbitron)]">
                  ZIII Helpdesk
                </div>
                <div className="text-xs text-gray-500">Service Desk ITIL v4</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Sistema profesional de gestión de tickets con trazabilidad completa, 
              auditoría y soporte multinivel basado en mejores prácticas ITIL.
            </p>
          </div>

          {/* Navegación rápida */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Navegación
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/tickets" 
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Mis Tickets
                </Link>
              </li>
              <li>
                <Link 
                  href="/tickets/new" 
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Nuevo Ticket
                </Link>
              </li>
              <li>
                <Link 
                  href="/reports" 
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Reportes
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Recursos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/audit" 
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Auditoría
                </Link>
              </li>
              <li>
                <a 
                  href="https://www.axelos.com/certifications/itil-service-management" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                >
                  ITIL v4 Framework
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <span className="text-xs text-gray-400 cursor-not-allowed">
                  Documentación
                </span>
              </li>
              <li>
                <span className="text-xs text-gray-400 cursor-not-allowed">
                  Soporte Técnico
                </span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Contacto
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:helpdesk@integracional3.com.mx"
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  helpdesk@integracional3.com.mx
                </a>
              </li>
              <li>
                <a 
                  href="https://integracional3.com.mx" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  integracional3.com.mx
                </a>
              </li>
            </ul>
            
            {/* Badge de certificación */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] font-bold text-blue-700 leading-none">
                  ITIL® v4
                </div>
                <div className="text-[9px] text-blue-600 leading-none mt-0.5">
                  Certified
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">
              © {currentYear} <span className="font-semibold text-gray-700">Integracional3</span>. 
              Todos los derechos reservados.
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">
                Versión 1.0.0
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500">Sistema Operativo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
