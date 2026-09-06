import { QrCode, Clock, Users } from 'lucide-react'
import PlaceholderCard from '../../components/PlaceholderCard'

export default function SessionQR() {
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
            <span className="course-badge">IT301</span>
            <h2>Data Structures</h2>
            <div className="qr-meta">
              <span><Clock size={14} /> 10:00 AM – 11:00 AM</span>
              <span className="badge badge-blue">Lecture</span>
            </div>
          </div>
          <div className="qr-code-area">
            <QrCode size={120} strokeWidth={1} />
            <p>QR code will appear here</p>
            <span className="text-muted">Refreshes every 15 seconds</span>
          </div>
        </div>

        <div className="qr-sidebar-card card">
          <h3><Users size={18} /> Attendance</h3>
          <div className="qr-attendance-count">
            <strong>0</strong>
            <span>/ 48 students scanned</span>
          </div>
          <p className="text-muted">Students will appear here as they scan.</p>
        </div>
      </div>

      <PlaceholderCard
        title="Live QR Coming Soon"
        message="This page will show a real rotating QR code and live attendance updates in the next phase."
      />
    </>
  )
}
