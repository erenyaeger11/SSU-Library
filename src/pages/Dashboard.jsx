import { useEffect, useState } from 'react'
import { Activity, BookOpen, CalendarDays, GraduationCap, UsersRound, ArrowUpRight } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import StatCard from '../components/StatCard'
import VisitorTable from '../components/VisitorTable'
import { reportsApi } from '../services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsApi.dashboard().then((response) => setData(response.data)).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const chartData = {
    labels: data?.trend?.map((item) => item.label) || [],
    datasets: [{ data: data?.trend?.map((item) => Number(item.total)) || [], fill: true, tension: 0.38, borderColor: '#3b7655', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#fff', pointBorderColor: '#3b7655', backgroundColor: (context) => {
      const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 190)
      gradient.addColorStop(0, 'rgba(87, 145, 105, .19)')
      gradient.addColorStop(1, 'rgba(87, 145, 105, 0)')
      return gradient
    } }],
  }

  return (
    <>
      <div className="page-intro"><div><h2>Your library, at a glance.</h2><p>A little snapshot of the life in your library today.</p></div><div className="date-chip"><CalendarDays size={14} />{dateLabel}</div></div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="Today's visitors" value={loading ? '…' : data?.stats?.today_visitors ?? 0} change={data?.stats?.visitor_change} note="vs. yesterday" icon={UsersRound} />
        <StatCard label="Study visits" value={loading ? '…' : data?.stats?.study_visits ?? 0} note="Today" icon={BookOpen} tone="blue" />
        <StatCard label="Borrow book" value={loading ? '…' : data?.stats?.borrow_visits ?? 0} note="Today" icon={Activity} tone="orange" />
        <StatCard label="Registered students" value={loading ? '…' : data?.stats?.students ?? 0} note="Active student records" icon={GraduationCap} tone="purple" />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading"><div><h3>Library footfall</h3><p>Daily visitors over the last 7 days</p></div><span className="purpose-pill purpose-study"><i /> VISITORS</span></div>
          <div className="chart-wrap">{data?.trend?.length ? <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { displayColors: false, backgroundColor: '#203b2e', padding: 10, titleFont: { size: 10 }, bodyFont: { size: 11 } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#9ba49f', font: { size: 9 } } }, y: { beginAtZero: true, grid: { color: '#f0f2f0' }, border: { display: false, dash: [3, 3] }, ticks: { color: '#a3aba7', font: { size: 9 }, precision: 0 } } } }} /> : <div className="page-message">{loading ? 'Gathering this week’s activity…' : 'Visitor activity will appear here.'}</div>}</div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h3>A note from the desk</h3><p>Your recent library activity</p></div></div>
          <div style={{ display: 'grid', gap: 16, padding: '2px 1px' }}>
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}><div className="stat-icon tone-green"><UsersRound size={17} /></div><div><strong style={{ fontSize: 11 }}>Readers checked in</strong><p style={{ color: '#8d9792', fontSize: 10, margin: '4px 0' }}>{data?.stats?.today_visitors ?? 0} visits have been recorded today.</p></div></div>
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}><div className="stat-icon tone-orange"><BookOpen size={17} /></div><div><strong style={{ fontSize: 11 }}>The library is in session</strong><p style={{ color: '#8d9792', fontSize: 10, margin: '4px 0' }}>Keep the scanner ready for the next visitor.</p></div></div>
            <a className="text-link" href="/visitors">See all visitor logs <ArrowUpRight size={13} /></a>
          </div>
        </section>
      </div>
      <section className="panel visitors-panel">
        <div className="panel-heading"><div><h3>Recent visitors</h3><p>A warm welcome, one check-in at a time.</p></div><a className="text-link" href="/visitors">View all <ArrowUpRight size={13} /></a></div>
        {loading ? <div className="page-message">Loading recent visits…</div> : <VisitorTable visits={data?.recent_visits || []} compact />}
      </section>
    </>
  )
}
