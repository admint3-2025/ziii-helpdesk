import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'ACCOUNT_LOCKED'
  | 'RATE_LIMIT_EXCEEDED'

export type AuditMetadata = {
  ip?: string
  userAgent?: string
  email?: string
  reason?: string
  [key: string]: any
}

/**
 * Log authentication events to audit log
 */
export async function logAuthEvent(
  action: AuditAction,
  metadata: AuditMetadata,
  userId?: string
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient()
    
    await admin.from('audit_log').insert({
      entity_type: 'auth',
      entity_id: userId || metadata.email || 'unknown',
      action,
      actor_id: userId || null,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    // Don't throw errors for audit logging failures
    console.error('[Audit] Failed to log auth event:', error)
  }
}

// Track failed login attempts per email - lazy initialization
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>()
let cleanupIntervalId: NodeJS.Timeout | null = null

// Initialize cleanup on first use to avoid issues in serverless
function initCleanup() {
  if (cleanupIntervalId === null) {
    cleanupIntervalId = setInterval(() => {
      const now = Date.now()
      const timeout = 15 * 60 * 1000 // 15 minutes
      for (const [email, data] of failedLoginAttempts.entries()) {
        if (now - data.lastAttempt > timeout) {
          failedLoginAttempts.delete(email)
        }
      }
    }, 15 * 60 * 1000)
  }
}

export function recordFailedLogin(email: string): void {
  // Initialize cleanup on first use
  initCleanup()
  
  const entry = failedLoginAttempts.get(email)
  const now = Date.now()

  if (!entry) {
    failedLoginAttempts.set(email, { count: 1, lastAttempt: now })
  } else {
    entry.count++
    entry.lastAttempt = now
  }
}

export function clearFailedLogins(email: string): void {
  failedLoginAttempts.delete(email)
}

export function isAccountLocked(email: string): boolean {
  const entry = failedLoginAttempts.get(email)
  if (!entry) return false

  const now = Date.now()
  const lockoutDuration = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 5

  // If more than 5 failed attempts and last attempt was within 15 minutes
  if (entry.count >= maxAttempts && now - entry.lastAttempt < lockoutDuration) {
    return true
  }

  // If lockout period expired, clear the entry
  if (now - entry.lastAttempt >= lockoutDuration) {
    failedLoginAttempts.delete(email)
    return false
  }

  return false
}

export function getFailedLoginCount(email: string): number {
  return failedLoginAttempts.get(email)?.count || 0
}
