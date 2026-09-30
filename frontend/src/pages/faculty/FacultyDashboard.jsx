import { useState, useEffect } from 'react'
import { CalendarDays, Users, CheckCircle2, BookOpen, QrCode, ArrowRight, Clock, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      if (!user?.id) return
      try {
        const res = await apiFetch(`/faculty/${user.id}/dashboard`)
        setData(res)
      } catch (err) {
        console.error('Failed to load faculty dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [user])

  const stats = data?.stats
  const recentSessions = data?.recentSessions || []

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name || 'Faculty'}</h1>
          <p>Terna Engineering College (IT) — Teaching & Lecture Attendance Hub</p>
        </div>

        <Link to="/faculty/session/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          Create New Session
        </Link>
      </div>

      <div className="stats-grid four-col">
        <div className="stat-card">
          <div className="stat-top">
            <span>Sessions Conducted</span>
            <span className="stat-icon info"><CalendarDays size={18} /></span>
          </div>
          <strong className="stat-value">{loading ? '...' : stats?.totalSessions || 0}</strong>
          <p className="stat-detail">{loading ? 'Loading...' : `${stats?.monthSessions || 0} in September 2026`}</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Active Students</span>
            <span className="stat-icon success"><Users size={18} /></span>
          </div>
          <strong className="stat-value">{loading ? '...' : stats?.activeStudents || 0}</strong>
          <p className="stat-detail">IT Department Roster</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Avg Attendance</span>
            <span className="stat-icon success"><CheckCircle2 size={18} /></span>
          </div>
          <strong className="stat-value" style={{ color: 'var(--success)' }}>
            {loading ? '...' : stats?.avgAttendance || '0.0%'}
          </strong>
          <p className="stat-detail">Across your sessions</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Assigned Courses</span>
            <span className="stat-icon info"><BookOpen size={18} /></span>
          </div>
          <strong className="stat-value">{loading ? '...' : stats?.totalCourses || 0}</strong>
          <p className="stat-detail">Semester 3 Curriculum</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Recent Teaching Sessions</h2>
            <p className="text-muted" style={{ margin: 0 }}>
              Live attendance records and session details from the database
            </p>
          </div>
          <Link to="/faculty/attendance" className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Open Attendance Editor
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            Loading recent sessions...
          </p>
        ) : recentSessions.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p className="text-muted">No sessions have been created yet.</p>
            <Link to="/faculty/session/new" className="btn btn-primary" style={{ marginTop: '10px' }}>
              Create Your First Session
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Attendance Scanned</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => {
                const isPractical = s.session_type === 'practical'
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="course-badge" style={{ marginRight: '8px' }}>{s.course_code}</span>
                      <strong>{s.course_name}</strong>
                    </td>
                    <td>
                      <span className={`badge ${isPractical ? 'badge-purple' : 'badge-blue'}`}>
                        {isPractical ? 'Practical Lab' : 'Theory Lecture'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Clock size={14} style={{ color: 'var(--ink-soft)' }} />
                        <span>{s.session_date} ({s.start_time} - {s.end_time})</span>
                      </div>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <strong style={{ fontSize: '14px' }}>
                          {s.attendanceCount} / {s.totalStudents}
                        </strong>
                        <span className="text-muted" style={{ fontSize: '12px' }}>
                          ({s.totalStudents > 0 ? Math.round((s.attendanceCount / s.totalStudents) * 100) : 0}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link 
                          to={`/faculty/session/${s.id}`} 
                          className="btn btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Open rotating dynamic QR code"
                        >
                          <QrCode size={13} />
                          Live QR
                        </Link>
                        <Link 
                          to={`/faculty/attendance?sessionId=${s.id}`}
                          className="btn btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Review or edit student attendance roster"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
