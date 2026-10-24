import { useEffect, useState } from 'react'
import { CalendarDays, Download, Search } from 'lucide-react'
import VisitorTable from '../components/VisitorTable'
import { studentsApi, visitsApi } from '../services/api'
import { downloadCsv } from '../utils/format'

export default function VisitorLogs() {
  const [filters, setFilters] = useState({ search: '', program: '', year_level: '', purpose: '', date_from: '', date_to: '', sort: 'newest', page: 1 })
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, pages: 1 })
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    visitsApi.list(filters).then((response) => {
      if (!cancelled) { setItems(response.data.items || []); setMeta(response.data.pagination || { total: 0, pages: 1 }); setError('') }
    }).catch((e) => { if (!cancelled) setError(e.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filters])
  useEffect(() => {
    studentsApi.list().then((response) => setPrograms([...new Set(response.data.map((student) => student.program))].sort()))
      .catch((e) => setError(e.message))
  }, [])
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }))
  const exportCurrent = async () => {
    try {
      const rows = []
      let page = 1
      let pages = 1
      do {
        const response = await visitsApi.list({ ...filters, page, per_page: 10000 })
        rows.push(...response.data.items)
        pages = response.data.pagination.pages
        page += 1
      } while (page <= pages)
      downloadCsv(rows.map(({ student_id, full_name, program, year_level, purpose, visit_date, time_in }) => ({ 'Student ID': student_id, 'Full name': full_name, Program: program, 'Year level': year_level, Purpose: purpose, Date: visit_date, 'Time in': time_in })), `library-visits-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (e) { setError(e.message) }
  }

  return <>
    <div className="page-intro"><div><h2>The library, in good company.</h2><p>Search and filter every student visit recorded at the desk.</p></div><button className="button button-secondary" onClick={exportCurrent}><Download size={15} /> Export CSV</button></div>
    {error && <div className="alert alert-error">{error}</div>}
    <section className="content-card">
      <div className="content-heading"><h3>Visitor history <span style={{ color: '#99a29e', fontWeight: 500 }}>({meta.total})</span></h3></div>
      <div className="toolbar">
        <div className="search-input"><Search size={15} /><input placeholder="Search student or ID..." value={filters.search} onChange={(e) => update('search', e.target.value)} /></div>
        <select className="control-select" value={filters.purpose} onChange={(e) => update('purpose', e.target.value)}><option value="">All purposes</option><option>Study</option><option>Borrow Book</option></select>
        <select className="control-select" value={filters.program} onChange={(e) => update('program', e.target.value)}><option value="">All programs</option>{programs.map((program) => <option key={program}>{program}</option>)}</select>
        <select className="control-select" value={filters.year_level} onChange={(e) => update('year_level', e.target.value)}><option value="">All years</option>{['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((year) => <option key={year}>{year}</option>)}</select>
        <input className="control-select" aria-label="Filter from date" type="date" value={filters.date_from} onChange={(e) => update('date_from', e.target.value)} />
        <input className="control-select" aria-label="Filter to date" type="date" value={filters.date_to} onChange={(e) => update('date_to', e.target.value)} />
        <select className="control-select" value={filters.sort} onChange={(e) => update('sort', e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
      </div>
      {loading ? <div className="page-message">Finding visitor records…</div> : <VisitorTable visits={items} />}
      <div className="table-footer"><span>Showing {meta.total ? (filters.page - 1) * 20 + 1 : 0}–{Math.min(filters.page * 20, meta.total)} of {meta.total} visits</span><div className="pagination"><button className="page-button" disabled={filters.page <= 1} onClick={() => update('page', filters.page - 1)}>‹</button><span style={{ padding: '7px 4px' }}>{filters.page} / {meta.pages || 1}</span><button className="page-button" disabled={filters.page >= (meta.pages || 1)} onClick={() => update('page', filters.page + 1)}>›</button></div></div>
    </section>
    <div style={{ marginTop: 14, color: '#9aa39f', fontSize: 10, display: 'flex', alignItems: 'center', gap: 6 }}><CalendarDays size={13} /> Dates and times are recorded by the library server.</div>
  </>
}
