import { useState, useEffect, useRef } from 'react'
import { QrCode, MapPin, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

export default function StudentScanner() {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle') // idle, locating, scanning, success, error
  const [message, setMessage] = useState('')
  const [location, setLocation] = useState(null)
  const scannerRef = useRef(null)

  // Start the location + scanning process
  const startProcess = () => {
    setStatus('locating')
    setMessage('Getting your location...')
    
    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        startScanner()
      },
      (err) => {
        console.error(err)
        setStatus('error')
        setMessage('Failed to get location. Please enable location services.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const startScanner = () => {
    setStatus('scanning')
    setMessage('Point your camera at the QR code')
    
    // Slight delay to ensure the DOM element exists
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false)
      
      scannerRef.current = scanner

      scanner.render(async (decodedText) => {
        // Stop scanning immediately on first read
        scanner.clear()
        scannerRef.current = null
        handleScan(decodedText)
      }, (error) => {
        // ignore continuous scan errors
      })
    }, 100)
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e))
      }
    }
  }, [])

  const handleScan = async (qrData) => {
    setStatus('processing')
    setMessage('Verifying attendance...')
    
    try {
      // Expected format: session_id:token
      const [sessionId, token] = qrData.split(':')
      
      if (!sessionId || !token) {
        throw new Error('Invalid QR code format')
      }

      await apiFetch('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          student_id: user.id,
          session_id: sessionId,
          token: token,
          lat: location.lat,
          lng: location.lng,
          device_fingerprint: 'browser-proto-123'
        })
      })

      setStatus('success')
      setMessage('Attendance marked successfully!')
    } catch (err) {
      console.error(err)
      setStatus('error')
      setMessage(err.message || 'Failed to mark attendance')
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Scan QR Code</h1>
          <p>Point your camera at the QR code displayed by your faculty</p>
        </div>
      </div>

      <div className="scanner-placeholder">
        <div className="scanner-box" style={{ padding: status === 'scanning' ? '24px' : '48px 32px' }}>
          
          {status === 'idle' && (
            <>
              <QrCode size={64} style={{ opacity: 0.5 }} />
              <h3>Ready to Scan</h3>
              <p>Location access will be requested.</p>
              <button className="btn btn-primary" onClick={startProcess}>
                Start Scanner
              </button>
            </>
          )}

          {(status === 'locating' || status === 'processing') && (
            <>
              <Loader2 size={48} className="spin" style={{ color: 'var(--primary)' }} />
              <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <h3>{status === 'locating' ? 'Locating...' : 'Verifying...'}</h3>
              <p>{message}</p>
            </>
          )}

          {status === 'scanning' && (
            <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
              <div id="reader" style={{ width: '100%' }}></div>
              <p style={{ marginTop: 16 }}>{message}</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 size={64} style={{ color: 'var(--success)' }} />
              <h3 style={{ color: 'var(--success)' }}>Success!</h3>
              <p>{message}</p>
              <button className="btn btn-primary" onClick={() => setStatus('idle')}>
                Scan Another
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle size={64} style={{ color: 'var(--danger)' }} />
              <h3 style={{ color: 'var(--danger)' }}>Error</h3>
              <p>{message}</p>
              <button className="btn" onClick={() => setStatus('idle')} style={{ marginTop: 12 }}>
                Try Again
              </button>
            </>
          )}

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
