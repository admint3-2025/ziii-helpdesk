/**
 * Secure logging utility that sanitizes sensitive data
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

/**
 * Sanitize sensitive data before logging
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    // Sanitize emails
    if (data.includes('@')) {
      const parts = data.split('@')
      if (parts.length === 2) {
        const [user, domain] = parts
        return `${user.substring(0, 2)}***@${domain}`
      }
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Sensitive keys to redact
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key')
      ) {
        sanitized[key] = '***REDACTED***'
      } else if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeData(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  return data
}

/**
 * Secure logger that sanitizes sensitive information
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, ...args.map(sanitizeData))
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args.map(sanitizeData))
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args.map(sanitizeData))
  },

  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, ...args.map(sanitizeData))
    }
  },
}
