import { z } from 'zod'

// Email validation
export const emailSchema = z.string().email().trim().toLowerCase()

// Password validation - enforce strong password
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial')

// User role validation
export const userRoleSchema = z.enum([
  'requester',
  'agent_l1',
  'agent_l2',
  'supervisor',
  'auditor',
  'admin',
])

// UUID validation
export const uuidSchema = z.string().uuid()

// Safe string (no special characters that could be used for injection)
export const safeStringSchema = z
  .string()
  .trim()
  .max(255)
  .regex(/^[a-zA-Z0-9\s\-_.,áéíóúÁÉÍÓÚñÑüÜ]*$/, 'Contiene caracteres no permitidos')

// User creation schema
export const createUserSchema = z.object({
  email: emailSchema,
  full_name: z.string().trim().min(1).max(255),
  role: userRoleSchema,
  department: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  building: z.string().trim().max(100).optional(),
  floor: z.string().trim().max(50).optional(),
  position: z.string().trim().max(255).optional(),
  invite: z.boolean().optional(),
  password: z.string().optional(),
})

// User update schema
export const updateUserSchema = z.object({
  full_name: z.string().trim().min(1).max(255).optional(),
  role: userRoleSchema.optional(),
  department: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  building: z.string().trim().max(100).optional(),
  floor: z.string().trim().max(50).optional(),
  position: z.string().trim().max(255).optional(),
  active: z.boolean().optional(),
})

// Ticket creation schema
export const createTicketSchema = z.object({
  title: z.string().trim().min(5, 'El título debe tener al menos 5 caracteres').max(255),
  description: z.string().trim().min(20, 'La descripción debe tener al menos 20 caracteres'),
  category_id: uuidSchema.nullable(),
  impact: z.number().int().min(1).max(4),
  urgency: z.number().int().min(1).max(4),
  priority: z.number().int().min(1).max(4),
  support_level: z.number().int().min(1).max(2),
  requester_id: uuidSchema.optional(),
})

// Sanitize filename to prevent directory traversal and XSS
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 255)
}

// Validate and sanitize HTML input (for now, just strip it)
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
