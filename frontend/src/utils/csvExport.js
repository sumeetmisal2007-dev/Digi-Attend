/**
 * Utility to export JavaScript array of objects to a downloadable CSV file.
 * Automatically escapes commas, newlines, and double quotes.
 */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.')
    return
  }

  const separator = ','
  const keys = Object.keys(rows[0])

  const csvContent = [
    keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(separator),
    ...rows.map(row =>
      keys
        .map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : String(row[k])
          return `"${cell.replace(/"/g, '""')}"`
        })
        .join(separator)
    )
  ].join('\r\n')

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
