/**
 * Utilidad para generar códigos QR reales y escaneables
 */

import QRCode from 'qrcode'

export interface QROptions {
  size?: number
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Genera un código QR como Data URL (base64)
 * @param text Texto a codificar en el QR
 * @param options Opciones de generación
 * @returns Promise con data URL del QR
 */
export async function generateQRCode(
  text: string,
  options: QROptions = {}
): Promise<string> {
  const {
    size = 300,
    margin = 2,
    errorCorrectionLevel = 'H'
  } = options

  try {
    // Usar librería qrcode con alta calidad
    return await QRCode.toDataURL(text, {
      width: size,
      margin,
      errorCorrectionLevel,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Error generando QR:', error)
    throw new Error('No se pudo generar el código QR')
  }
}

/**
 * Genera información estática del activo para QR
 * @param assetData Datos básicos del activo
 */
export function getAssetQRContent(assetData: {
  assetTag: string
  assetType: string
  brand?: string
  model?: string
  serialNumber?: string
  status?: string
}): string {
  // Información textual que siempre será visible, incluso si el activo fue dado de baja
  const lines = [
    `ACTIVO: ${assetData.assetTag}`,
    `TIPO: ${assetData.assetType}`,
  ]
  
  if (assetData.brand) lines.push(`MARCA: ${assetData.brand}`)
  if (assetData.model) lines.push(`MODELO: ${assetData.model}`)
  if (assetData.serialNumber) lines.push(`SERIE: ${assetData.serialNumber}`)
  if (assetData.status) lines.push(`ESTADO: ${assetData.status}`)
  
  lines.push('') // Línea vacía
  lines.push('Este activo ha sido procesado')
  lines.push('para solicitud de baja.')
  lines.push('Consultar documento oficial.')
  
  return lines.join('\n')
}
  
  // Alternativa: JSON con más datos
  // return JSON.stringify({
  //   type: 'asset',
  //   code: assetCode,
  //   url: getAssetQRUrl(assetCode),
  //   timestamp: Date.now()
  // })
}
