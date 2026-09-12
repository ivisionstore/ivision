const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app/admin/coupons/page.tsx')
let source = fs.readFileSync(file, 'utf8')

// Remove one or more accidental backslashes before JSX tags.
source = source.replace(/\\+(?=<\/?[A-Za-z])/g, '')

if (!source.includes('FileSpreadsheet')) {
  source = source.replace(
    "  type LucideIcon,\n} from 'lucide-react'",
    "  type LucideIcon,\n  FileSpreadsheet,\n} from 'lucide-react'",
  )
}

if (!source.includes('exportBusy')) {
  source = source.replace(
    "  const [newPassword, setNewPassword] = useState('')",
    "  const [newPassword, setNewPassword] = useState('')\n  const [exportBusy, setExportBusy] = useState(false)",
  )
}

if (!source.includes('async function exportCustomers')) {
  const marker = "  async function updatePassword(e: FormEvent) {"
  const fn = `  async function exportCustomers() {
    setExportBusy(true)
    setErr('')
    setMsg('')

    try {
      const { data, error } = await supabase.rpc('export_coupon_customers')
      if (error) throw error

      const rows = (data || []).map((row: any, index: number) => ({
        '#': index + 1,
        'Customer Phone': row.customer_phone || '',
        'Coupon Code': row.coupon_code || '',
        'Campaign': row.campaign_name || '',
        'Discount': row.discount_text || '',
        'Claimed At': row.claimed_at ? new Date(row.claimed_at).toLocaleString() : '',
        'Status': row.coupon_status || '',
        'Used At': row.used_at ? new Date(row.used_at).toLocaleString() : '',
      }))

      if (!rows.length) {
        setErr('No coupon customers found to export.')
        return
      }

      const XLSX = await import('xlsx')
      const worksheet = XLSX.utils.json_to_sheet(rows)
      worksheet['!cols'] = [
        { wch: 6 }, { wch: 20 }, { wch: 20 }, { wch: 30 },
        { wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 24 },
      ]
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Coupon Customers')
      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(workbook, \`IVISION-Coupon-Customers-\${date}.xlsx\`, { compression: true })
      setMsg(\`\${rows.length} customer record(s) exported to Excel.\`)
    } catch (error: any) {
      setErr(error?.message || 'Could not export customer data.')
    } finally {
      setExportBusy(false)
    }
  }

`
  if (source.includes(marker)) source = source.replace(marker, fn + marker)
}

if (!source.includes('Export Customer Excel')) {
  const marker = '<div className="flex flex-wrap justify-between gap-3 items-center"><div><h2 className="font-bold text-lg">Coupon Inventory</h2>'
  const buttonMarker = '</p></div><button type="button" onClick={() => selected && loadStats(selected.id)}'
  const button = `<div className="flex items-center gap-2"><button type="button" onClick={exportCustomers} disabled={exportBusy} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 px-4 py-2.5 text-sm font-bold disabled:opacity-50" title="Export all customers who received a coupon"><FileSpreadsheet size={16} />{exportBusy ? 'Exporting…' : 'Export Customer Excel'}</button>`
  if (source.includes(marker) && source.includes(buttonMarker)) {
    source = source.replace(buttonMarker, '</p></div>' + button + '<button type="button" onClick={() => selected && loadStats(selected.id)}')
  }
}

// Final sanitation: remove any remaining escaped JSX tag markers.
source = source.replace(/\\+(?=<\/?[A-Za-z])/g, '')
fs.writeFileSync(file, source)
console.log('Coupon customer Excel export prepared.')
