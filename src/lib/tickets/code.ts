const MX_TIME_ZONE = 'America/Mexico_City'

export function formatTicketCode(params: { ticket_number: number; created_at: string | null }): string {
  const { ticket_number, created_at } = params

  const date = created_at ? new Date(created_at) : new Date()

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MX_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const [year, month, day] = formatter.format(date).split('-')
  const seq = String(ticket_number).padStart(4, '0')

  return `${year}${month}${day}-${seq}`
}
