import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { validateFileUpload } from '@/lib/security/file-validation'
import { sanitizeFilename } from '@/lib/security/validation'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type UploadResult = {
  success: boolean
  path?: string
  publicUrl?: string
  error?: string
}

/**
 * Sube un archivo a Supabase Storage
 */
export async function uploadTicketAttachment(
  ticketId: string,
  file: File,
  userId: string
): Promise<UploadResult> {
  // Comprehensive validation including magic number checking
  const validation = await validateFileUpload(file)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  const supabase = createSupabaseBrowserClient()

  // Generar nombre único para evitar colisiones y sanitizar
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileExt = file.name.split('.').pop()
  const sanitizedName = sanitizeFilename(file.name)
  const fileName = `${ticketId}/${timestamp}-${randomStr}.${fileExt}`

  try {
    // Subir archivo a Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Obtener URL pública (firmada temporalmente)
    const { data: urlData } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(fileName)

    // Registrar en la base de datos con nombre sanitizado
    const { error: dbError } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        file_name: sanitizedName,
        file_size: file.size,
        file_type: file.type,
        storage_path: fileName,
        uploaded_by: userId,
      })

    if (dbError) {
      console.error('Error saving attachment metadata:', dbError)
      // Intentar eliminar el archivo subido
      await supabase.storage.from('ticket-attachments').remove([fileName])
      return { success: false, error: 'Error al guardar información del archivo' }
    }

    return {
      success: true,
      path: fileName,
      publicUrl: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'Error inesperado al subir archivo' }
  }
}

/**
 * Obtiene la URL firmada de un archivo (válida por 1 hora)
 */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()

  const { data, error } = await supabase.storage
    .from('ticket-attachments')
    .createSignedUrl(storagePath, 3600) // 1 hora

  if (error) {
    console.error('Error getting signed URL:', error)
    return null
  }

  return data.signedUrl
}

/**
 * Elimina un archivo (soft delete)
 */
export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient()

  // Soft delete en la base de datos
  const { error } = await supabase
    .from('ticket_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', attachmentId)

  if (error) {
    console.error('Error deleting attachment:', error)
    return false
  }

  // Nota: No eliminamos físicamente del Storage para mantener integridad de auditoría
  return true
}

/**
 * Obtiene los adjuntos de un ticket
 */
export async function getTicketAttachments(ticketId: string) {
  try {
    const supabase = createSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('ticket_attachments')
      .select('id, file_name, file_size, file_type, storage_path, uploaded_by, created_at')
      .eq('ticket_id', ticketId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attachments:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return []
  }
}

/**
 * Formatea el tamaño de archivo para mostrar
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Obtiene el ícono según el tipo de archivo
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType === 'text/plain') return '📃'
  return '📎'
}
