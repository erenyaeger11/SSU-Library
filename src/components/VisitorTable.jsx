import { ArrowUpRight } from 'lucide-react'
import { formatDate, formatTime, initials } from '../utils/format'

export default function VisitorTable({ visits = [], compact = false }) {
  if (!visits.length) return <div className="empty-state"><div className="empty-icon">✳</div><strong>No visits yet</strong><p>Recorded library visits will show up here.</p></div>
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>STUDENT</th><th>PROGRAM</th><th>YEAR</th><th>PURPOSE</th>{!compact && <th>DATE</th>}<th>TIME IN</th>{!compact && <th />}</tr></thead>
        <tbody>{visits.map((visit) => (
          <tr key={visit.id}>
            <td><div className="person-cell"><div className="person-avatar">{initials(visit.full_name)}</div><div><strong>{visit.full_name}</strong><small>{visit.student_id}</small></div></div></td>
            <td>{visit.program}</td><td>{visit.year_level}</td>
            <td><span className={`purpose-pill ${visit.purpose === 'Study' ? 'purpose-study' : 'purpose-borrow'}`}><i />{visit.purpose}</span></td>
            {!compact && <td>{formatDate(visit.visit_date)}</td>}
            <td>{formatTime(visit.time_in)}</td>{!compact && <td><button className="row-action" aria-label={`View visit by ${visit.full_name}`}><ArrowUpRight size={16} /></button></td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
