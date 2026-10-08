import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'
import { exportToCSV } from '../../utils/csvExport'
import { CheckCircle2, AlertCircle, Save, Filter, Clock, Search, Users, Sparkles, Download } from 'lucide-react'

export default function EditAttendance() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSessionId = searchParams.get('sessionId') || ''

  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId)
  const [sessionData, setSessionData] = useState(null)
  const [records, setRecords] = useState([])
  const [originalRecords, setOriginalRecords] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null) 

  useEffect(() => {
    async function loadSessions() {
      if (!user?.id) return
      setLoadingSessions(true)
      try {
        const data = await apiFetch(`/faculty/${user.id}/sessions`)
        setSessions(data)
        if (data.length > 0) {
          const matched = data.find(s => s.id === initialSessionId)
          setSelectedSessionId(matched ? matched.id : data[0].id)
        }
      } catch (err) {
        console.error('Failed to load faculty sessions', err)
      } finally {
        setLoadingSessions(false)
      }
    }
    loadSessions()
  }, [user, initialSessionId])

  useEffect(() => {
    async function loadAttendance() {
      if (!selectedSessionId) {
        setSessionData(null)
        setRecords([])
        return
      }
      setLoadingRecords(true)
      setFeedback(null)
      try {
        const data = await apiFetch(`/sessions/${selectedSessionId}/attendance`)
        setSessionData(data.session)
        setRecords(data.records)
        setOriginalRecords(data.records)
      } catch (err) {
        console.error('Failed to load session attendance roster', err)
        setFeedback({ type: 'danger', message: 'Failed to load attendance records for this session.' })
      } finally {
        setLoadingRecords(false)
      }
    }
    loadAttendance()
  }, [selectedSessionId])

  const handleSessionChange = (e) => {
    const newId = e.target.value
    setSelectedSessionId(newId)
    setSearchParams(newId ? { sessionId: newId } : {})
  }

  const handleStatusChange = (studentId, newStatus) => {
    setRecords(prev =>
      prev.map(r => (r.student_id === studentId ? { ...r, status: newStatus } : r))
    )
  }

  const handleSetAll = (status) => {
    setRecords(prev => prev.map(r => ({ ...r, status })))
  }

  const handleSave = async () => {
    if (!selectedSessionId || records.length === 0) return
    setSaving(true)
    setFeedback(null)

    const originalMap = new Map(originalRecords.map(r => [r.student_id, r.status]))
    const changed = records.filter(r => originalMap.get(r.student_id) !== r.status)

    const payload = (changed.length > 0 ? changed : records).map(r => ({
      student_id: r.student_id,
      status: r.status
    }))

    try {
      const res = await apiFetch(`/sessions/${selectedSessionId}/attendance`, {
        method: 'PUT',
        body: JSON.stringify({ updates: payload })
      })

      setOriginalRecords([...records])
      setFeedback({
        type: 'success',
        message: res.message || 'Attendance changes saved successfully to database!'
      })
    } catch (err) {
      console.error('Failed to save attendance', err)
      setFeedback({
        type: 'danger',
        message: err.message || 'Failed to save changes. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount = records.filter(r => r.status === 'absent').length
  const lateCount = records.filter(r => r.status === 'late').length
  const totalCount = records.length
  const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  const handleExportCSV = () => {
    if (!sessionData || !records.length) return
    const exportRows = records.map((r, idx) => ({
      'Sr No': idx + 1,
      'Roll Number': r.roll_number,
      'Student Name': r.name,
      'Batch': r.batch || 'A1',
      'Attendance Status': (r.status || 'ABSENT').toUpperCase(),
      'Marked At': r.marked_at ? new Date(r.marked_at).toLocaleString() : 'Not Recorded',
      'GPS Lat': r.scan_lat || '-',
      'GPS Lng': r.scan_lng || '-'
    }))
    const cleanDate = (sessionData.session_date || 'session').replace(/[^a-zA-Z0-9]/g, '_')
    const filename = `Attendance_${sessionData.course_code || 'Course'}_${cleanDate}_${sessionData.session_type || 'class'}`
    exportToCSV(filename, exportRows)
  }

  return (
    <>
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Edit Attendance</h1>
          <p>Review and modify live student attendance records for your conducted sessions</p>
        </div>

        {records.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={handleExportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Download session attendance sheet as CSV for Microsoft Excel"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || loadingRecords}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div 
          className={`alert-banner ${feedback.type}`} 
          style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label style={{ fontWeight: 600, fontSize: '13px' }}>Select Conducted Session</label>
            <select
              className="form-input"
              value={selectedSessionId}
              onChange={handleSessionChange}
              disabled={loadingSessions || sessions.length === 0}
            >
              {loadingSessions ? (
                <option>Loading your sessions...</option>
              ) : sessions.length === 0 ? (
                <option>No sessions available</option>
              ) : (
                sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.course_code} — {s.course_name} ({s.session_date} | {s.start_time} - {s.end_time} | {s.session_type})
                  </option>
                ))
              )}
            </select>
          </div>

          {sessionData && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => handleSetAll('present')}
                title="Mark all students as present"
              >
                Mark All Present
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => handleSetAll('absent')}
                title="Mark all students as absent"
              >
                Mark All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {}
      {sessionData && (
        <div className="stats-grid four-col" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-top">
              <span>Present Students</span>
              <span className="stat-icon success"><CheckCircle2 size={16} /></span>
            </div>
            <strong className="stat-value" style={{ color: 'var(--success)' }}>{presentCount}</strong>
            <p className="stat-detail">{presentPercentage}% of class</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Absent Students</span>
              <span className="stat-icon danger"><AlertCircle size={16} /></span>
            </div>
            <strong className="stat-value" style={{ color: 'var(--danger)' }}>{absentCount}</strong>
            <p className="stat-detail">Marked absent</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Late Scans</span>
              <span className="stat-icon info"><Clock size={16} /></span>
            </div>
            <strong className="stat-value">{lateCount}</strong>
            <p className="stat-detail">Arrived after start</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Total Class Size</span>
              <span className="stat-icon info"><Users size={16} /></span>
            </div>
            <strong className="stat-value">{totalCount}</strong>
            <p className="stat-detail">Semester 3 Students</p>
          </div>
        </div>
      )}

      {}
      <div className="card">
        {loadingRecords ? (
          <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            Loading attendance records from database...
          </p>
        ) : !selectedSessionId ? (
          <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            Please select a session above to view and modify student attendance.
          </p>
        ) : (
          <>
            {}
            <div className="table-toolbar" style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by student name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-input form-input-sm"
                style={{ width: 'auto' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses ({records.length})</option>
                <option value="present">Present ({presentCount})</option>
                <option value="absent">Absent ({absentCount})</option>
                <option value="late">Late ({lateCount})</option>
              </select>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll / ID Number</th>
                  <th>Student Name</th>
                  <th>Academic Info</th>
                  <th>Status</th>
                  <th>Modify Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-soft)' }}>
                      No students match the current search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    return (
                      <tr key={r.student_id}>
                        <td><span className="course-badge">{r.roll_number}</span></td>
                        <td><strong>{r.name}</strong></td>
                        <td>Year {r.year}, Sem {r.semester}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: r.status === 'present' ? '#f0fdf4' : r.status === 'late' ? '#fefce8' : '#fef2f2',
                              color: r.status === 'present' ? '#16a34a' : r.status === 'late' ? '#ca8a04' : '#dc2626',
                              borderColor: r.status === 'present' ? '#bbf7d0' : r.status === 'late' ? '#fef08a' : '#fecaca',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-input form-input-sm"
                            value={r.status}
                            onChange={(e) => handleStatusChange(r.student_id, e.target.value)}
                            style={{ width: '110px', fontWeight: 600 }}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {filteredRecords.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: '13px' }}>
                  Showing {filteredRecords.length} of {records.length} students
                </span>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
