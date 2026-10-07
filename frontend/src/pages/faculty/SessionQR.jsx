import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { Clock, Users, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function SessionQR() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [token, setToken] = useState(null)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [error, setError] = useState(null)
  const [ending, setEnding] = useState(false)

  // Poll for new token and attendance count
  useEffect(() => {
    async function fetchSessionData() {
      try {
        const data = await apiFetch(`/sessions/${id}/qr`)
        setSession(data.session)
        setToken(data.token)
        setAttendanceCount(data.attendanceCount)
        
        // Generate QR code image format: session_id:token
        const qrContent = `${id}:${data.token}`
        const url = await QRCode.toDataURL(qrContent, { 
          width: 240,
          margin: 1,
          color: {
            dark: '#0f1d2f',
            light: '#ffffff'
          }
        })
        setQrCodeDataUrl(url)
      } catch (err) {
        console.error(err)
        setError('Failed to load session data')
      }
    }

    // Initial fetch
    fetchSessionData()

    // Poll every 3 seconds to get fresh tokens and live attendance counts
    const interval = setInterval(fetchSessionData, 3000)
    return () => clearInterval(interval)
  }, [id])

  const handleEndSession = async () => {
    if (!window.confirm('Conclude this session?\n\nThis will deactivate the QR code so no more students can mark attendance.')) return

    setEnding(true)
    try {
      await apiFetch(`/sessions/${id}/close`, { method: 'POST' })
      navigate(`/faculty/attendance?sessionId=${id}`)
    } catch (err) {
      alert('Failed to close session: ' + err.message)
      setEnding(false)
    }
  }

  if (error) {
    return <div className="page-header"><h1>Error</h1><p className="text-danger">{error}</p></div>
  }

  if (!session) {
    return <div className="page-header"><h1>Loading session...</h1></div>
  }

  // Calculate time remaining until next rotation (approximate for UI)
  const secondsRemaining = 15 - Math.floor((Date.now() / 1000) % 15)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Session QR Code</h1>
          <p>Display this dynamic rolling QR code on projector for students to scan</p>
        </div>
        {session.is_active === false && (
          <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}>
            <Lock size={14} /> Session Concluded
          </span>
        )}
      </div>

      <div className="qr-display-placeholder">
        <div className="qr-main-card card">
          <div className="qr-info">
            <span className="course-badge">{session.course_code}</span>
            <h2>{session.course_name}</h2>
            <div className="qr-meta">
              <span><Clock size={14} /> {session.start_time.slice(0,5)} – {session.end_time.slice(0,5)}</span>
              <span className={`badge ${session.session_type === 'practical' ? 'badge-purple' : 'badge-blue'}`}>
                {session.session_type}
              </span>
              {session.session_type === 'practical' && session.batch && session.batch !== 'all' && (
                <span className="badge badge-purple" style={{ fontWeight: 700, background: '#ede9fe', color: '#6d28d9', borderColor: '#c4b5fd' }}>
                  Batch {session.batch} ({session.batch === 'A1' ? 'Roll 1–36' : 'Roll 37–80'})
                </span>
              )}
            </div>
          </div>
          <div className="qr-code-area">
            {session.is_active === false ? (
              <div style={{ width: 240, height: 240, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '2px dashed #cbd5e1', padding: '16px', textAlign: 'center' }}>
                <Lock size={40} style={{ color: '#64748b', marginBottom: '8px' }} />
                <strong>Session Locked</strong>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Attendance marking is closed</span>
              </div>
            ) : qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Session QR Code" style={{ width: 240, height: 240, borderRadius: '8px' }} />
            ) : (
              <div style={{ width: 240, height: 240, background: '#f1f5f9' }} />
            )}
            <p>{session.is_active === false ? 'Attendance closed' : 'Scan via Digi-Attend Student Portal'}</p>
            {session.is_active !== false && (
              <span className="text-muted">Dynamic token rotates in {secondsRemaining}s</span>
            )}
          </div>
        </div>

        <div className="qr-sidebar-card card">
          <h3><Users size={18} /> Attendance Counter</h3>
          <div className="qr-attendance-count">
            <strong>{attendanceCount}</strong>
            <span>students scanned</span>
          </div>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '13px' }}>
            The counter updates in real time as students verify campus geofence and scan.
          </p>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {session.is_active !== false ? (
              <button 
                className="btn btn-primary" 
                onClick={handleEndSession}
                disabled={ending}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}
              >
                {ending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {ending ? 'Concluding...' : 'End Class & Review Attendance'}
              </button>
            ) : null}

            <Link 
              to={`/faculty/attendance?sessionId=${id}`} 
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center' }}
            >
              View Full Student Roster <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
