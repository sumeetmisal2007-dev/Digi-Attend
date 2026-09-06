import { QrCode, MapPin } from 'lucide-react'

export default function StudentScanner() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Scan QR Code</h1>
          <p>Point your camera at the QR code displayed by your faculty</p>
        </div>
      </div>

      <div className="scanner-placeholder">
        <div className="scanner-box">
          <QrCode size={64} />
          <h3>QR Scanner</h3>
          <p>Camera access will be requested when this feature is activated.</p>
          <button className="btn btn-primary" disabled>
            Open Scanner
          </button>
        </div>

        <div className="scanner-info">
          <div className="info-item">
            <MapPin size={18} />
            <div>
              <strong>Location Required</strong>
              <p>You must be within 200m of Terna Engineering College campus</p>
            </div>
          </div>
          <div className="info-item">
            <QrCode size={18} />
            <div>
              <strong>QR Rotates Every 15s</strong>
              <p>The code changes frequently to prevent proxy attendance</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
