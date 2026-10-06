import { useState, useEffect, useRef } from 'react'
import { QrCode, MapPin, CheckCircle2, AlertTriangle, Loader2, Navigation, Compass, Sparkles, Smartphone, ShieldCheck, Lock } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function getOrCreateDeviceId() {
  let id = localStorage.getItem('attendance_device_id')
  if (!id) {
    id = 'dev-' + (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 10) + '-' + Date.now())
    localStorage.setItem('attendance_device_id', id)
  }
  return id
}

// Haversine distance in meters
function computeDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function StudentScanner() {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle') // idle, locating, scanning, processing, success, error
  const [message, setMessage] = useState('')
  const [location, setLocation] = useState(null)
  const [isSimulated, setIsSimulated] = useState(false)
  const [campusInfo, setCampusInfo] = useState({
    name: 'Terna Engineering College, Nerul',
    campus_lat: 19.0330,
    campus_lng: 73.0297,
    campus_radius_m: 200
  })

  const scannerRef = useRef(null)

  // Fetch campus coordinates
  useEffect(() => {
    async function loadCampus() {
      try {
        const info = await apiFetch('/campus/info')
        setCampusInfo(info)
      } catch (err) {
        console.error('Failed to load campus info', err)
      }
    }
    loadCampus()
  }, [])

  // Calculate live distance if location is set
  const currentDistance = location
    ? Math.round(computeDistance(location.lat, location.lng, campusInfo.campus_lat, campusInfo.campus_lng))
    : null

  const isInsideCampus = currentDistance !== null && currentDistance <= campusInfo.campus_radius_m

  // Simulate on-campus location
  const toggleSimulation = () => {
    if (!isSimulated) {
      // Simulate exact coordinates of Terna campus
      setLocation({
        lat: 19.0330,
        lng: 73.0297,
        simulated: true
      })
      setIsSimulated(true)
    } else {
      setLocation(null)
      setIsSimulated(false)
    }
  }

  // Start the location + scanning process
  const startProcess = () => {
    if (isSimulated && location) {
      startScanner()
      return
    }

    setStatus('locating')
    setMessage('Acquiring high-accuracy GPS fix for geofence verification...')
    
    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setLocation(coords)
        setIsSimulated(false)

        const dist = computeDistance(coords.lat, coords.lng, campusInfo.campus_lat, campusInfo.campus_lng)
        if (dist > campusInfo.campus_radius_m) {
          setStatus('error')
          setMessage(`Geofence Alert: You are ${Math.round(dist)}m away from campus. Attendance requires you to be within ${campusInfo.campus_radius_m}m of campus perimeter.`)
        } else {
          startScanner()
        }
      },
      (err) => {
        console.error(err)
        setStatus('error')
        setMessage('GPS access was denied or timed out. Please allow location permissions in your browser.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const startScanner = () => {
    setStatus('scanning')
    setMessage('Point your camera at the dynamic QR code displayed on the screen')
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false)
      
      scannerRef.current = scanner

      scanner.render(async (decodedText) => {
        scanner.clear()
        scannerRef.current = null
        handleScan(decodedText)
      }, (error) => {
        // ignore continuous scan search errors
      })
    }, 100)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e))
      }
    }
  }, [])

  const handleScan = async (qrData) => {
    setStatus('processing')
    setMessage('Verifying attendance, batch enrollment & single-device binding...')
    
    try {
      const [sessionId, token] = qrData.split(':')
      
      if (!sessionId || !token) {
        throw new Error('Invalid QR code format. Please scan a valid session QR.')
      }

      if (!location?.lat || !location?.lng) {
        throw new Error('GPS coordinates not acquired. Please tap "Verify GPS & Open Scanner" first.')
      }

      const devId = getOrCreateDeviceId()
      const res = await apiFetch('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          student_id: user.id,
          session_id: sessionId,
          token: token,
          lat: location.lat,
          lng: location.lng,
          device_id: devId,
          device_fingerprint: devId
        })
      })

      setStatus('success')
      setMessage(res.message || 'Attendance successfully marked within campus geofence!')
    } catch (err) {
      console.error(err)
      setStatus('error')
      setMessage(err.message || 'Failed to mark attendance')
    }
  }

  return (
    <>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Scan QR Code</h1>
          <p>Geo-verified attendance scanner for lectures and practical labs</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-purple" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}>
            Batch: {user?.batch || 'A1'}
          </span>
          <span className="badge" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--ink-soft)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} /> Single-Device Lock
          </span>
          {/* Localhost / Dev Simulation Button */}
          <button 
            className={`btn ${isSimulated ? 'btn-primary' : ''}`}
            onClick={toggleSimulation}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
          </button>
        </div>
      </div>

      {/* Geofence Status Radar Banner */}
      <div 
        className="card" 
        style={{ 
          marginBottom: '20px', 
          padding: '16px 20px',
          borderLeft: `5px solid ${isInsideCampus ? 'var(--success)' : location ? 'var(--danger)' : 'var(--primary)'}` 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: isInsideCampus ? 'var(--success-bg)' : 'var(--info-bg)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: isInsideCampus ? 'var(--success)' : 'var(--primary)'
              }}
            >
              <Navigation size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>
                Campus Geofence: {campusInfo.name}
              </strong>
              <span className="text-muted" style={{ fontSize: '12px' }}>
                Perimeter Center: {campusInfo.campus_lat}° N, {campusInfo.campus_lng}° E | Radius: {campusInfo.campus_radius_m} meters
              </span>
            </div>
          </div>

          <div>
            {location ? (
              <span 
                className={`badge ${isInsideCampus ? 'badge-blue' : 'badge-purple'}`}
                style={{ 
                  background: isInsideCampus ? '#f0fdf4' : '#fef2f2', 
                  color: isInsideCampus ? '#16a34a' : '#dc2626',
                  borderColor: isInsideCampus ? '#bbf7d0' : '#fecaca',
                  padding: '6px 12px',
                  fontSize: '12px'
                }}
              >
                {isInsideCampus ? (
                  <>🟢 Within Campus ({currentDistance}m from center)</>
                ) : (
                  <>🔴 Outside Campus ({currentDistance}m away)</>
                )}
                {isSimulated && ' [Simulated]'}
              </span>
            ) : (
              <span className="badge" style={{ color: 'var(--ink-soft)' }}>
                Location not yet verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="scanner-placeholder">
        <div className="scanner-box" style={{ padding: status === 'scanning' ? '24px' : '48px 32px' }}>
          
          {status === 'idle' && (
            <>
              <QrCode size={64} style={{ opacity: 0.5 }} />
              <h3>Ready to Scan</h3>
              <p>GPS coordinates will be validated against Terna Engineering College perimeter (200m).</p>
              <button className="btn btn-primary" onClick={startProcess}>
                Verify GPS & Start Scanner
              </button>
            </>
          )}

          {(status === 'locating' || status === 'processing') && (
            <>
              <Loader2 size={48} className="spin" style={{ color: 'var(--primary)' }} />
              <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <h3>{status === 'locating' ? 'Checking Geofence...' : 'Verifying Attendance...'}</h3>
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
              <h3 style={{ color: 'var(--success)' }}>Attendance Verified!</h3>
              <p>{message}</p>
              <button className="btn btn-primary" onClick={() => setStatus('idle')}>
                Scan Another
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle size={64} style={{ color: 'var(--danger)' }} />
              <h3 style={{ color: 'var(--danger)' }}>Scan Denied</h3>
              <p style={{ maxWidth: '440px', margin: '0 auto', fontSize: '13px' }}>{message}</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                <button className="btn" onClick={() => setStatus('idle')}>
                  Try Again
                </button>
                {!isInsideCampus && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      toggleSimulation()
                      setStatus('idle')
                    }}
                  >
                    Simulate On-Campus GPS & Retry
                  </button>
                )}
              </div>
            </>
          )}

        </div>

        <div className="scanner-info">
          <div className="info-item">
            <MapPin size={18} />
            <div>
              <strong>Strict Geofence Enforced</strong>
              <p>GPS verification ensures attendance can only be registered within {campusInfo.campus_radius_m}m of Terna campus</p>
            </div>
          </div>
          <div className="info-item">
            <QrCode size={18} />
            <div>
              <strong>Anti-Proxy 15s Dynamic QR</strong>
              <p>Rotating cryptographic tokens prevent sharing screenshots with absent students</p>
            </div>
          </div>
          <div className="info-item">
            <Compass size={18} />
            <div>
              <strong>Lecture & Practical Verification</strong>
              <p>Both theory and lab sessions are credited directly to your monthly subject attendance report</p>
            </div>
          </div>
          <div className="info-item">
            <Smartphone size={18} />
            <div>
              <strong>Single-Device Hardware Lock</strong>
              <p>Your account is cryptographically bound to this phone/browser. Proxy scanning is strictly forbidden.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
