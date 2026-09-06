import { CalendarDays, Users, CheckCircle2 } from 'lucide-react'

const stats = [
  { label: 'Sessions This Week', value: '12', detail: '3 lectures, 2 practicals today', icon: CalendarDays, tone: 'info' },
  { label: 'Active Students', value: '48', detail: 'Across 3 courses', icon: Users, tone: 'success' },
  { label: 'Avg Attendance', value: '82.5%', detail: '+3.2% vs last month', icon: CheckCircle2, tone: 'success' },
]

export default function FacultyDashboard() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome, Dr. Nisha</h1>
          <p>Your teaching overview for this semester</p>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-top">
              <span>{s.label}</span>
              <span className={`stat-icon ${s.tone}`}><s.icon size={18} /></span>
            </div>
            <strong className="stat-value">{s.value}</strong>
            <p className="stat-detail">{s.detail}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Today&apos;s Sessions</h2>
        <p className="text-muted">Your scheduled sessions and their attendance status will appear here.</p>
      </div>
    </>
  )
}
