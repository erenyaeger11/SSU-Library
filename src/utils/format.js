export const formatTime = (value) => value
  ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(`1970-01-01T${value}`))
  : '—'

export const formatDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
  : '—'

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

export const downloadCsv = (rows, filename) => {
  if (!rows?.length) return
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [Object.keys(rows[0]), ...rows.map((row) => Object.values(row))]
    .map((line) => line.map(escape).join(',')).join('\r\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
