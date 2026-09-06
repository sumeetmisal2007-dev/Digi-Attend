import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { Clock, Users } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function SessionQR() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [token, setToken] = useState(null)
  const [attendanceCount, setAttendanceCount] = useState(0)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [error, setError] = useState(null)

  // Poll for new token and attendance count
  useEffect(() => {
    async function fetchSessionData() {
      try {
        const data = await apiFetch(`/sessions/${id}/qr`)
        setSession(data.session)
        setToken(data.token)
        setAttendanceCount(data.attendanceCount)
        
        // Generate QR code image
        // Format: session_id:token
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
          <p>Display this QR code for students to scan</p>
        </div>
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
            </div>
          </div>
          <div className="qr-code-area">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="Session QR Code" style={{ width: 240, height: 240 }} />
            ) : (
              <div style={{ width: 240, height: 240, background: '#f1f5f9' }} />
            )}
            <p>Scan to mark attendance</p>
            <span className="text-muted">Refreshes in {secondsRemaining}s</span>
          </div>
        </div>

        <div className="qr-sidebar-card card">
          <h3><Users size={18} /> Attendance</h3>
          <div className="qr-attendance-count">
            <strong>{attendanceCount}</strong>
            <span>students scanned</span>
          </div>
          <p className="text-muted" style={{ marginTop: 12 }}>
            The counter updates automatically as students scan the code.
          </p>
        </div>
      </div>
    </>
  )
}
