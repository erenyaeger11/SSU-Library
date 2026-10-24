import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, QrCode, Trash2, UserRoundX, Printer, ChevronLeft, ChevronRight } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import Modal from '../components/Modal'
import { studentsApi } from '../services/api'
import { initials } from '../utils/format'

const emptyForm = { student_id: '', full_name: '', program: '', year_level: '', status: 'Active' }
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

// Student form used for create/edit actions in the library directory.
function StudentForm({ initial, onSave, onCancel, busy, error }) {
  const [form, setForm] = useState(initial || emptyForm)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  return <form onSubmit={(event) => { event.preventDefault(); onSave(form) }}>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="form-grid">
      <div className="form-field"><label htmlFor="student-id">Student ID</label><input className="field-control" id="student-id" required maxLength="40" value={form.student_id} onChange={(e) => update('student_id', e.target.value)} placeholder="2025-00123" /></div>
      <div className="form-field"><label htmlFor="full-name">Full name</label><input className="field-control" id="full-name" required maxLength="150" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Juan Dela Cruz" /></div>
      <div className="form-field form-span"><label htmlFor="program">Program / course</label><input className="field-control" id="program" required maxLength="120" value={form.program} onChange={(e) => update('program', e.target.value)} placeholder="BS Information Technology" /></div>
      <div className="form-field"><label htmlFor="year-level">Year level</label><select className="field-control" id="year-level" required value={form.year_level} onChange={(e) => update('year_level', e.target.value)}><option value="">Select year</option>{years.map((year) => <option key={year}>{year}</option>)}</select></div>
      <div className="form-field"><label htmlFor="status">Status</label><select className="field-control" id="status" value={form.status} onChange={(e) => update('status', e.target.value)}><option>Active</option><option>Inactive</option></select></div>
    </div>
    <div className="form-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save student'}</button></div>
  </form>
}

function printQr(student) {
  const canvas = document.querySelector('#student-qr canvas')
  if (!canvas) return
  const image = canvas.toDataURL('image/png')
  const popup = window.open('', '_blank', 'width=420,height=540')
  if (!popup) return
  popup.document.write(`<html><head><title>Student QR · ${student.student_id}</title><style>body{font:14px Arial;text-align:center;padding:32px;color:#172221}img{width:240px;height:240px}p{color:#68736d}</style></head><body><h2>SSU Library</h2><img src="${image}" alt="Student QR code"><h3>${student.full_name}</h3><p>${student.student_id} · ${student.program}</p><p>${student.qr_identifier}</p><script>window.onload=()=>window.print()</script></body></html>`)
  popup.document.close()
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const load = async () => {
    setLoading(true)
    try { const response = await studentsApi.list(); setStudents(response.data || []); setError('') }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => students.filter((student) => {
    const matches = `${student.full_name} ${student.student_id} ${student.program}`.toLowerCase().includes(search.toLowerCase())
    return matches && (statusFilter === 'all' || student.status.toLowerCase() === statusFilter)
  }), [students, search, statusFilter])
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, statusFilter])

  const save = async (form) => {
    setSaving(true); setFormError('')
    try {
      if (selected) await studentsApi.update({ ...form, id: selected.id })
      else await studentsApi.create(form)
      setModal(''); setSelected(null); await load()
    } catch (e) { setFormError(e.message) } finally { setSaving(false) }
  }
  const openForm = (student = null) => { setSelected(student); setFormError(''); setModal('form') }

  const changeStatus = async (student) => {
    const next = student.status === 'Active' ? 'Inactive' : 'Active'
    if (!window.confirm(`${next === 'Inactive' ? 'Deactivate' : 'Reactivate'} ${student.full_name}?`)) return
    try { await studentsApi.update({ ...student, status: next }); await load() } catch (e) { setError(e.message) }
  }
  const deleteStudent = async (student) => {
    if (!window.confirm(`Permanently delete ${student.full_name}? Students with visit history must be deactivated instead.`)) return
    try { await studentsApi.remove(student.id); await load() } catch (e) { setError(e.message) }
  }

  return <>
    <div className="page-intro"><div><h2>Student directory</h2><p>Manage student records and their library QR passes.</p></div><button className="button" onClick={() => openForm()}><Plus size={16} /> Add student</button></div>
    {error && <div className="alert alert-error">{error}</div>}
    <section className="content-card">
      <div className="content-heading"><h3>All students <span style={{ color: '#99a29e', fontWeight: 500 }}>({filtered.length})</span></h3></div>
      <div className="toolbar">
        <div className="search-input"><Search size={15} /><input placeholder="Search name, ID or program..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="control-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      </div>
      {loading ? <div className="page-message">Loading student records…</div> : visible.length ? <div className="table-scroll"><table className="data-table">
        <thead><tr><th>STUDENT</th><th>PROGRAM</th><th>YEAR</th><th>STATUS</th><th>QR PASS</th><th /></tr></thead>
        <tbody>{visible.map((student) => <tr key={student.id}>
          <td><div className="person-cell"><div className="person-avatar">{initials(student.full_name)}</div><div><strong>{student.full_name}</strong><small>{student.student_id}</small></div></div></td>
          <td>{student.program}</td><td>{student.year_level}</td><td><span className={`status-pill ${student.status === 'Active' ? '' : 'status-inactive'}`}><i className="online-indicator" style={{ width: 6, height: 6, background: student.status === 'Active' ? '#5ab27b' : '#a4aaa7' }} />{student.status}</span></td>
          <td><button className="button button-secondary button-small" onClick={() => { setSelected(student); setModal('qr') }}><QrCode size={13} /> View QR</button></td>
          <td><div className="row-actions"><button className="row-action" onClick={() => openForm(student)} aria-label={`Edit ${student.full_name}`} title="Edit"><Pencil size={15} /></button><button className="row-action" onClick={() => changeStatus(student)} aria-label={`${student.status === 'Active' ? 'Deactivate' : 'Reactivate'} ${student.full_name}`} title={student.status === 'Active' ? 'Deactivate' : 'Reactivate'}><UserRoundX size={15} /></button><button className="row-action" onClick={() => deleteStudent(student)} aria-label={`Delete ${student.full_name}`} title="Delete"><Trash2 size={15} /></button></div></td>
        </tr>)}</tbody>
      </table></div> : <div className="empty-state"><div className="empty-icon">✳</div><strong>No students found</strong><p>Try another search, or add a student to the directory.</p></div>}
      {!loading && <div className="table-footer"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} students</span><div className="pagination"><button className="page-button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>{Array.from({ length: pages }, (_, i) => i + 1).map((number) => <button key={number} className={`page-button ${number === page ? 'active' : ''}`} onClick={() => setPage(number)}>{number}</button>)}<button className="page-button" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={14} /></button></div></div>}
    </section>
    {modal === 'form' && <Modal title={selected ? 'Edit student' : 'Add a student'} subtitle="Their QR pass is generated automatically when you save." onClose={() => { setModal(''); setSelected(null) }}><StudentForm key={selected?.id || 'new'} initial={selected} onSave={save} onCancel={() => setModal('')} busy={saving} error={formError} /></Modal>}
    {modal === 'qr' && selected && <Modal title="Student QR pass" subtitle="This code contains only a unique student identifier." onClose={() => setModal('')}><div className="modal-qr"><div className="qr-frame" id="student-qr"><QRCodeCanvas value={selected.qr_identifier} size={208} level="H" includeMargin /></div><strong>{selected.full_name}</strong><p>{selected.student_id} · {selected.qr_identifier}</p><button className="button" onClick={() => printQr(selected)}><Printer size={15} /> Print QR pass</button></div></Modal>}
  </>
}
