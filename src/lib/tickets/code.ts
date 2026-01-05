const MX_TIME_ZONE = 'America/Mexico_City'

export function formatTicketCode(params: { ticket_number: number; created_at: string | null }): string {
  const { ticket_number, created_at } = params

  if (!created_at) {
    const seq = String(ticket_number).padStart(4, '0')
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}${month}${day}-${seq}`
  }

  const date = new Date(created_at)
  
  // Ajustar a zona horaria de México
  const mxDate = new Date(date.toLocaleString('en-US', { timeZone: MX_TIME_ZONE }))
  
  const year = mxDate.getFullYear()
  const month = String(mxDate.getMonth() + 1).padStart(2, '0')
  const day = String(mxDate.getDate()).padStart(2, '0')
  const seq = String(ticket_number).padStart(4, '0')

  return `${year}${month}${day}-${seq}`
}
