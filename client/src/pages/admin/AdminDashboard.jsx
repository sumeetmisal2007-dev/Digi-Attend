import { Users, BookOpen, GraduationCap, Shield } from 'lucide-react'

const stats = [
  { label: 'Total Students', value: '186', detail: 'IT Department', icon: GraduationCap, tone: 'info' },
  { label: 'Faculty Members', value: '8', detail: '3 with HOD access', icon: Users, tone: 'success' },
  { label: 'Active Courses', value: '12', detail: 'Semester 3', icon: BookOpen, tone: 'info' },
  { label: 'System Status', value: 'Active', detail: 'All services running', icon: Shield, tone: 'success' },
]

export default function AdminDashboard() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>System overview — Information Technology Department</p>
        </div>
      </div>
      <div className="stats-grid four-col">
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
        <h2>Quick Actions</h2>
        <p className="text-muted">Use the sidebar to manage students and courses.</p>
      </div>
    </>
  )
}
