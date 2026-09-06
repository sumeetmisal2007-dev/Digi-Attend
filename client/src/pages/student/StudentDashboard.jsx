import { CheckCircle2, CalendarDays, BookOpen } from 'lucide-react'

const stats = [
  { label: 'Attendance Rate', value: '74.3%', detail: 'Below 75% requirement', icon: CheckCircle2, tone: 'danger' },
  { label: 'Classes Attended', value: '129', detail: 'out of 174 total', icon: CalendarDays, tone: 'info' },
  { label: 'Courses Enrolled', value: '5', detail: 'Semester 3', icon: BookOpen, tone: 'success' },
]

export default function StudentDashboard() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome back, Aarav</h1>
          <p>Here is your attendance overview for Semester 3</p>
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
        <h2>Recent Activity</h2>
        <p className="text-muted">Your latest attendance records will appear here.</p>
      </div>
    </>
  )
}
