export default function StatCard({ label, value, change, note, icon: Icon, tone = 'green' }) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{label}</span><div className={`stat-icon tone-${tone}`}><Icon size={18} strokeWidth={1.8} /></div></div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-foot">{change && <span className="stat-change">{change}</span>}<span>{note}</span></div>
    </article>
  )
}
