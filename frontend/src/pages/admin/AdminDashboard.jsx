import { useState, useEffect } from 'react'
import { Users, BookOpen, GraduationCap, Shield, CalendarDays, Database, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../utils/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiFetch('/admin/stats')
        setStats(data)
      } catch (err) {
        console.error('Failed to load admin stats', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>System Overview & Academic Configuration — {stats?.department || 'Information Technology'}</p>
        </div>
      </div>

      <div className="stats-grid four-col">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Students</span>
            <span className="stat-icon info"><GraduationCap size={18} /></span>
          </div>
          <strong className="stat-value">{loading ? '...' : stats?.totalStudents || 0}</strong>
          <p className="stat-detail">Loaded from master database</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Faculty Members</span>
            <span className="stat-icon success"><Users size={18} /></span>
          </div>
          <strong className="stat-value">{loading ? '...' : stats?.facultyMembers || 0}</strong>
          <p className="stat-detail">Teaching staff & HOD</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Active Courses</span>
            <span className="stat-icon info"><BookOpen size={18} /></span>
          </div>
          <strong className="stat-value">{loading ? '...' : stats?.activeCourses || 0}</strong>
          <p className="stat-detail">Theory & practical labs</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Sessions</span>
            <span className="stat-icon success"><CalendarDays size={18} /></span>
          </div>
          <strong className="stat-value">{loading ? '...' : stats?.totalSessions || 0}</strong>
          <p className="stat-detail">Aug & Sep 2026</p>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} style={{ color: 'var(--primary)' }} />
            Database & System Health
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <span className="text-muted">Database Engine:</span>
              <strong>{loading ? 'Connecting...' : stats?.database || 'MongoDB'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <span className="text-muted">System Status:</span>
              <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Active & Connected
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <span className="text-muted">Dept Avg Attendance:</span>
              <strong style={{ color: 'var(--success)' }}>{loading ? '...' : stats?.avgAttendance || '0.0%'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Academic Department:</span>
              <strong>{stats?.department || 'Information Technology'}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: 'var(--primary)' }} />
            Quick Academic Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link 
              to="/admin/students" 
              className="btn" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}
            >
              <span>Manage Student Roster ({stats?.totalStudents || 80} Students)</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              to="/admin/courses" 
              className="btn" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}
            >
              <span>Manage Course Allocations ({stats?.activeCourses || 10} Courses)</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
