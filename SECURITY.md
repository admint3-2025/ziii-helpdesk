# Security Features

This document outlines the security features implemented in the ZIII Helpdesk application.

## Overview

The application implements multiple layers of security to protect against common vulnerabilities:

## 1. Security Headers

**Location**: `next.config.ts`

Implemented security headers include:
- **X-Frame-Options**: `DENY` - Prevents clickjacking attacks
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Enables browser XSS protection
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: Restricts camera, microphone, geolocation access
- **Strict-Transport-Security**: Enforces HTTPS connections
- **Content-Security-Policy**: Restricts resource loading to trusted sources

## 2. Authentication Security

### Rate Limiting
**Location**: `src/lib/security/rate-limit.ts`

- **Login endpoint**: 5 attempts per minute per IP
- **Password reset**: 3 requests per 15 minutes per IP
- **User creation**: 10 requests per hour per IP

### Account Lockout
**Location**: `src/lib/security/audit.ts`

- Accounts are locked after 5 failed login attempts
- Lockout duration: 15 minutes
- Automatic cleanup of expired lockout records

### Password Policy
**Location**: `src/lib/security/validation.ts`

Strong password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Audit Logging
**Location**: `src/lib/security/audit.ts`

All authentication events are logged:
- Successful logins
- Failed login attempts
- Password reset requests
- Account lockouts
- Rate limit violations

## 3. Input Validation

**Location**: `src/lib/security/validation.ts`

All user inputs are validated using Zod schemas:
- Email validation with normalization
- Password strength validation
- User role validation
- UUID validation
- Safe string validation (prevents special characters)
- Ticket creation validation

## 4. File Upload Security

### Content-Based Validation
**Location**: `src/lib/security/file-validation.ts`

- **Magic Number Checking**: Validates files by checking their actual content (magic numbers), not just MIME types
- **Size Limits**: Maximum 10MB per file
- **Type Restrictions**: Only allows specific file types:
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, Word, Excel
  - Text files

### Filename Sanitization
**Location**: `src/lib/security/validation.ts`

Prevents directory traversal and XSS attacks:
- Removes special characters
- Prevents path traversal (../)
- Checks for reserved Windows filenames (CON, PRN, AUX, etc.)
- Validates file extensions against allowlist
- Limits filename length

## 5. CSRF Protection

**Location**: `src/lib/security/csrf.ts`

CSRF token utility available for protecting state-changing operations:
- Generates cryptographically secure tokens
- Stores hashed tokens in HTTP-only cookies
- Validates tokens on requests

**Note**: Currently available but not implemented in forms. Can be added as needed.

## 6. Secure Logging

**Location**: `src/lib/security/logger.ts`

Prevents sensitive data leakage in logs:
- Sanitizes email addresses
- Redacts passwords, tokens, secrets, and keys
- Only logs debug information in development mode

## 7. SQL Injection Prevention

- Uses Supabase client with parameterized queries
- All database operations use Supabase's query builder
- Row Level Security (RLS) policies enforce access control at the database level

## 8. XSS Prevention

- Content Security Policy headers
- Filename sanitization
- No use of `dangerouslySetInnerHTML` or `eval()`
- Input validation and sanitization

## 9. Session Management

- HTTP-only cookies for session tokens
- Secure flag enabled in production
- SameSite=Strict to prevent CSRF
- Automatic session refresh through middleware

## Configuration

### Environment Variables

The following environment variables should be configured:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SMTP (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SECURE=true
```

**Security Note**: Never commit `.env` or `.env.local` files to version control.

## Best Practices

1. **Keep Dependencies Updated**: Regularly update npm packages to patch security vulnerabilities
2. **Use HTTPS**: Always use HTTPS in production
3. **Rotate Secrets**: Regularly rotate service role keys and API keys
4. **Monitor Logs**: Review audit logs for suspicious activity
5. **Backup Data**: Regularly backup your Supabase database
6. **Limit Permissions**: Use principle of least privilege for user roles

## Security Checklist

- [x] Security headers configured
- [x] Rate limiting implemented
- [x] Strong password policy enforced
- [x] Account lockout mechanism
- [x] Audit logging for sensitive operations
- [x] File upload validation with magic numbers
- [x] Filename sanitization
- [x] Input validation with Zod
- [x] SQL injection prevention via Supabase
- [x] XSS prevention measures
- [x] Secure session management
- [x] CSRF protection utility available
- [ ] Regular security audits scheduled
- [ ] Penetration testing performed

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email security@yourcompany.com. Do not open a public issue.

## License

This security implementation follows industry best practices and OWASP guidelines.
