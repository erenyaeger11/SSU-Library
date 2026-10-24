import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { reportsApi } from '../services/api'
import StatCard from '../components/StatCard'
import { Activity, BookOpen, UsersRound } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 9 }, color: '#929c97' } }, y: { beginAtZero: true, grid: { color: '#eff1ef' }, border: { display: false }, ticks: { font: { size: 9 }, color: '#929c97', precision: 0 } } } }

export default function Reports() {
  const [period, setPeriod] = useState('month')
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    reportsApi.analytics({ period }).then((res) => { if (!cancelled) setReport(res.data) }).catch((e) => { if (!cancelled) setError(e.message) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [period])
  const exportReport = () => {
    if (!report) return
    const link = document.createElement('a')
    link.href = reportsApi.exportUrl({ period })
    link.download = `library-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }
  const purposeData = { labels: report?.visitors_by_purpose?.map((x) => x.purpose) || [], datasets: [{ data: report?.visitors_by_purpose?.map((x) => Number(x.total)) || [], backgroundColor: ['#528266', '#d9a16e'], borderWidth: 0, hoverOffset: 4 }] }
  const programData = { labels: report?.visitors_by_program?.slice(0, 8).map((x) => x.program) || [], datasets: [{ data: report?.visitors_by_program?.slice(0, 8).map((x) => Number(x.total)) || [], backgroundColor: '#639176', borderRadius: 5, maxBarThickness: 28 }] }
  const trendData = { labels: report?.visitors_by_day?.map((x) => x.label) || [], datasets: [{ label: 'Visitors', data: report?.visitors_by_day?.map((x) => Number(x.total)) || [], backgroundColor: '#d8e9dd', borderColor: '#548166', borderWidth: 1, borderRadius: 4, maxBarThickness: 22 }] }

  return <>
    <div className="page-intro"><div><h2>Little patterns, big picture.</h2><p>Library visits, gathered into a few useful stories.</p></div><div style={{ display: 'flex', gap: 8 }}><select className="control-select" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="day">Today</option><option value="week">This week</option><option value="month">This month</option></select><button className="button button-secondary" onClick={exportReport} disabled={!report}><Download size={14} /> Export CSV</button></div></div>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="report-stats">
      <StatCard label="Visits this period" value={loading ? '…' : report?.summary?.total_visits ?? 0} note="Recorded check-ins" icon={UsersRound} />
      <StatCard label="Study sessions" value={loading ? '…' : report?.summary?.study_visits ?? 0} note="Purpose: study" icon={BookOpen} tone="blue" />
      <StatCard label="Book borrowing" value={loading ? '…' : report?.summary?.borrow_visits ?? 0} note="Purpose: borrow" icon={Activity} tone="orange" />
    </div>
    <div className="report-grid">
      <section className="panel"><div className="panel-heading"><div><h3>Visitors by day</h3><p>Daily check-ins for the selected period</p></div></div><div className="chart-wrap">{report && <Bar data={trendData} options={chartOptions} />}</div></section>
      <section className="panel"><div className="panel-heading"><div><h3>Why students visit</h3><p>Purpose breakdown for this period</p></div></div><div className="chart-donut">{report && <Doughnut data={purposeData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 18, font: { size: 10 }, color: '#7f8984' } } }, cutout: '70%' }} />}</div></section>
      <section className="panel"><div className="panel-heading"><div><h3>Popular programs</h3><p>Library visitors by program</p></div></div><div className="chart-wrap">{report && <Bar data={programData} options={{ ...chartOptions, indexAxis: 'y', scales: { x: { ...chartOptions.scales.y }, y: { ...chartOptions.scales.x } } }} />}</div></section>
      <section className="panel"><div className="panel-heading"><div><h3>Frequent visitors</h3><p>Readers who checked in most often</p></div></div>
        {loading ? <div className="page-message">Loading…</div> : report?.frequent_visitors?.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>STUDENT</th><th>PROGRAM</th><th>VISITS</th></tr></thead><tbody>{report.frequent_visitors.map((item) => <tr key={item.student_id}><td><div className="person-cell"><div className="person-avatar">{item.full_name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}</div><div><strong>{item.full_name}</strong><small>{item.student_id}</small></div></div></td><td>{item.program}</td><td><strong style={{ color: '#315e44' }}>{item.total_visits}</strong></td></tr>)}</tbody></table></div> : <div className="page-message">No visitor history to report yet.</div>}
      </section>
    </div>
  </>
}
