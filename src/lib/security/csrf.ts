import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Hash token for storage (don't store plain token in cookie)
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const hashedToken = hashToken(token)
  
  const cookieStore = await cookies()
  cookieStore.set(CSRF_TOKEN_NAME, hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
  })
  
  return token
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_NAME)?.value
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME)
  
  if (!tokenFromHeader) {
    return false
  }
  
  const hashedTokenFromCookie = await getCsrfToken()
  
  if (!hashedTokenFromCookie) {
    return false
  }
  
  const hashedTokenFromHeader = hashToken(tokenFromHeader)
  
  return hashedTokenFromHeader === hashedTokenFromCookie
}

/**
 * Middleware helper to check CSRF token
 */
export async function requireCsrfToken(request: Request): Promise<Response | null> {
  const isValid = await validateCsrfToken(request)
  
  if (!isValid) {
    return new Response('Invalid CSRF token', { status: 403 })
  }
  
  return null
}
