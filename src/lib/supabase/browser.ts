import { createBrowserClient } from '@supabase/ssr'

/**
 * Detecta si el cliente está en la LAN (red local 10.10.1.x)
 * y devuelve la URL apropiada de Supabase
 */
function getSupabaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Si estamos en el servidor (SSR), usar la URL pública
  if (typeof window === 'undefined') {
    return publicUrl || ''
  }

  // Detectar si estamos en la LAN local
  const hostname = window.location.hostname
  
  // Verificar si estamos usando HTTP (no HTTPS) o una IP local
  const isHttpProtocol = window.location.protocol === 'http:'
  const isLocalIP = 
    hostname.startsWith('10.10.1.') || 
    hostname === '10.10.1.210' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  
  const isLocalNetwork = isHttpProtocol || isLocalIP

  // Si estamos en la LAN, usar la IP interna directamente
  if (isLocalNetwork) {
    return 'http://10.10.1.210:8000'
  }

  return publicUrl || ''
}

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      name: 'sb-helpdesk-auth',
    },
  })
}
