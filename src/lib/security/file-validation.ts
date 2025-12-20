/**
 * File signature (magic number) validation
 * Validates files by their actual content, not just MIME type
 */

type FileSignature = {
  bytes: number[]
  offset?: number
}

const FILE_SIGNATURES: Record<string, FileSignature[]> = {
  'image/jpeg': [
    { bytes: [0xff, 0xd8, 0xff] },
  ],
  'image/png': [
    { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  ],
  'application/pdf': [
    { bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ],
  // Microsoft Office formats (ZIP-based)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP signature
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP signature
  ],
  // Legacy Office formats
  'application/msword': [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE2 signature
  ],
  'application/vnd.ms-excel': [
    { bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE2 signature
  ],
}

/**
 * Read file header bytes
 */
async function readFileHeader(file: File, length: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      resolve(new Uint8Array(arrayBuffer))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file.slice(0, length))
  })
}

/**
 * Check if byte sequence matches signature
 */
function matchesSignature(bytes: Uint8Array, signature: FileSignature): boolean {
  const offset = signature.offset || 0
  
  for (let i = 0; i < signature.bytes.length; i++) {
    if (bytes[offset + i] !== signature.bytes[i]) {
      return false
    }
  }
  
  return true
}

/**
 * Validate file by checking magic numbers
 */
export async function validateFileMagicNumber(file: File): Promise<boolean> {
  try {
    const signatures = FILE_SIGNATURES[file.type]
    
    if (!signatures) {
      // If we don't have signatures for this type, allow plain text
      if (file.type === 'text/plain') {
        return true
      }
      return false
    }

    // Read enough bytes to check all signatures
    const maxLength = Math.max(
      ...signatures.map(sig => (sig.offset || 0) + sig.bytes.length)
    )
    
    const header = await readFileHeader(file, maxLength)
    
    // Check if any signature matches
    for (const signature of signatures) {
      if (matchesSignature(header, signature)) {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('Error validating file magic number:', error)
    return false
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFileUpload(file: File): Promise<{
  valid: boolean
  error?: string
}> {
  // Check file size
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. Máximo permitido: 10MB',
    }
  }

  // Check MIME type
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido',
    }
  }

  // Validate magic number (actual file content)
  const magicNumberValid = await validateFileMagicNumber(file)
  if (!magicNumberValid) {
    return {
      valid: false,
      error: 'El contenido del archivo no coincide con el tipo declarado',
    }
  }

  return { valid: true }
}
