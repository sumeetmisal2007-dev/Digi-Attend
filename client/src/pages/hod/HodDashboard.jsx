import { Users, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react'

const stats = [
  { label: 'Dept Attendance', value: '81.2%', detail: '+2.4% vs last month', icon: CheckCircle2, tone: 'success' },
  { label: 'Total Students', value: '186', detail: 'IT Department', icon: Users, tone: 'info' },
  { label: 'Active Courses', value: '12', detail: '8 lectures, 4 practicals', icon: BookOpen, tone: 'info' },
  { label: 'Below 75%', value: '23', detail: 'Students at risk', icon: AlertTriangle, tone: 'danger' },
]

const facultyActivity = [
  { name: 'Dr. Nisha Rao', sessions: 54, avgAttendance: '86.3%' },
  { name: 'Prof. Amit Desai', sessions: 42, avgAttendance: '78.9%' },
  { name: 'Dr. Snehal Patil', sessions: 38, avgAttendance: '91.2%' },
]

export default function HodDashboard() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Department Overview</h1>
          <p>Information Technology — Attendance analytics and faculty activity</p>
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
        <h2>Faculty Activity</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Sessions Taken</th>
              <th>Avg Attendance</th>
            </tr>
          </thead>
          <tbody>
            {facultyActivity.map((f) => (
              <tr key={f.name}>
                <td><strong>{f.name}</strong></td>
                <td>{f.sessions}</td>
                <td>{f.avgAttendance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Students Below 75%</h2>
        <p className="text-muted">A detailed list of at-risk students will appear here once connected to the database.</p>
      </div>
    </>
  )
}
