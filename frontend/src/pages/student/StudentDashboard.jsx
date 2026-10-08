import { useState, useEffect } from 'react'
import { CheckCircle2, CalendarDays, BookOpen, AlertTriangle, ArrowRight, Compass, Calculator } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      if (!user?.id) return
      try {
        const res = await apiFetch(`/student/${user.id}/monthly-analysis`)
        setData(res)
      } catch (err) {
        console.error('Failed to load student dashboard stats', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [user])

  const overall = data?.overall
  const isDefaulter = overall?.isDefaulter
  const monthName = data?.monthLabel || 'Current Month'

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name || 'Student'}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Terna Engineering College (IT Dept) — Semester 3 Attendance Hub</span>
            <span className="badge badge-purple" style={{ fontWeight: 700, fontSize: '11px' }}>
              Batch {user?.batch || 'A1'}
            </span>
          </p>
        </div>

        <Link to="/student/scan" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={16} />
          Scan Class QR
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>{monthName} Attendance</span>
            <span className={`stat-icon ${isDefaulter ? 'danger' : 'success'}`}>
              {isDefaulter ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </span>
          </div>
          <strong className="stat-value" style={{ color: isDefaulter ? 'var(--danger)' : 'var(--ink)' }}>
            {loading ? '...' : `${overall?.percentage}%`}
          </strong>
          <p className="stat-detail">
            {loading ? 'Calculating...' : isDefaulter ? `Below 75% — Need ${overall?.classesNeeded} classes` : 'Satisfies 75% requirement'}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Sessions Attended</span>
            <span className="stat-icon info"><CalendarDays size={18} /></span>
          </div>
          <strong className="stat-value">
            {loading ? '...' : `${overall?.attended}`}
          </strong>
          <p className="stat-detail">
            {loading ? '...' : `out of ${overall?.total} conducted in ${monthName}`}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Courses Tracked</span>
            <span className="stat-icon info"><BookOpen size={18} /></span>
          </div>
          <strong className="stat-value">
            {loading ? '...' : `${(data?.lectures?.length || 0) + (data?.practicals?.length || 0)}`}
          </strong>
          <p className="stat-detail">
            {loading ? '...' : `${data?.lectures?.length || 0} Lectures & ${data?.practicals?.length || 0} Practicals`}
          </p>
        </div>
      </div>

      {}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '6px' }}>Detailed Monthly Analysis</h2>
            <p className="text-muted" style={{ margin: 0 }}>
              Review your subject-wise lecture attendance, practical lab records, and defaulter status month-by-month.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/student/analysis" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calculator size={16} />
              Simulate Leave Impact
            </Link>
            <Link to="/student/analysis" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              View Subject Breakdown
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
