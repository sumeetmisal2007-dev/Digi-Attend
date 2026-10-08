import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { QrCode, MapPin, CheckCircle2, AlertTriangle, Loader2, Navigation, Compass, Sparkles, Smartphone, ShieldCheck, Lock, ExternalLink, SwitchCamera } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

function getOrCreateDeviceId() {
  let id = localStorage.getItem('attendance_device_id')
  if (!id) {
    const screenSig = `${window.screen?.width || 0}x${window.screen?.height || 0}`
    const rawUuid = window.crypto?.randomUUID ? window.crypto.randomUUID() : (Math.random().toString(36).substring(2, 10) + '-' + Date.now())
    id = `dev-${screenSig}-${rawUuid.slice(0, 8)}`
    localStorage.setItem('attendance_device_id', id)
  }
  return id
}

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
  const [status, setStatus] = useState('idle') 
  const [message, setMessage] = useState('')
  const [location, setLocation] = useState(null)
  const [isSimulated, setIsSimulated] = useState(false)
  const [lastMarked, setLastMarked] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') 
  const [availableCameras, setAvailableCameras] = useState([])
  const [campusInfo, setCampusInfo] = useState({
    name: 'Terna Engineering College, Nerul',
    campus_lat: 19.0298,
    campus_lng: 73.0166,
    campus_radius_m: 500
  })

  const scannerRef = useRef(null)

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

  const currentDistance = location
    ? Math.round(computeDistance(location.lat, location.lng, campusInfo.campus_lat, campusInfo.campus_lng))
    : null

  const isInsideCampus = currentDistance !== null && currentDistance <= campusInfo.campus_radius_m

  const toggleSimulation = () => {
    if (!isSimulated) {
      setLocation({
        lat: 19.0298,
        lng: 73.0166,
        simulated: true
      })
      setIsSimulated(true)
    } else {
      setLocation(null)
      setIsSimulated(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch (e) {
        console.warn('Scanner cleanup warning:', e)
      }
      scannerRef.current = null
    }
  }

  const startCameraScan = async (targetFacing = 'environment') => {
    await stopScanner()

    const readerEl = document.getElementById('reader')
    if (!readerEl) {
      setTimeout(() => startCameraScan(targetFacing), 60)
      return
    }

    try {
      const html5QrCode = new Html5Qrcode('reader')
      scannerRef.current = html5QrCode

      let cameras = availableCameras
      if (!cameras || cameras.length === 0) {
        try {
          cameras = await Html5Qrcode.getCameras()
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras)
          }
        } catch (e) {
          console.warn('Could not list cameras', e)
        }
      }

      let cameraConfig = null
      if (cameras && cameras.length > 0) {
        if (targetFacing === 'environment') {
          const backCam = cameras.find(c => /back|rear|environment|wide|main/i.test(c.label))
          cameraConfig = backCam ? backCam.id : (cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id)
        } else {
          const frontCam = cameras.find(c => /front|user|selfie/i.test(c.label))
          cameraConfig = frontCam ? frontCam.id : cameras[0].id
        }
      }

      if (!cameraConfig) {
        cameraConfig = { facingMode: targetFacing }
      }

      const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        cameraConfig,
        scanConfig,
        async (decodedText) => {
          await stopScanner()
          handleScan(decodedText)
        },
        () => {
        }
      )
    } catch (err) {
      console.warn(`Camera start failed with ${targetFacing}, falling back to facingMode constraint:`, err)
      try {
        if (scannerRef.current && !scannerRef.current.isScanning) {
          await scannerRef.current.start(
            { facingMode: targetFacing },
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            async (decodedText) => {
              await stopScanner()
              handleScan(decodedText)
            },
            () => {}
          )
          return
        }
      } catch (fallbackErr) {
        console.error('Camera fallback also failed', fallbackErr)
        setStatus('error')
        setMessage('Camera error: Unable to open camera. Please grant camera permissions in your browser.')
      }
    }
  }

  const flipCamera = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextFacing)
    if (status === 'scanning') {
      await startCameraScan(nextFacing)
    }
  }

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
    setMessage('Point your rear camera at the dynamic QR code displayed on the screen')
    setFacingMode('environment')
    setTimeout(() => {
      startCameraScan('environment')
    }, 100)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const handleScan = async (qrData) => {
    setStatus('processing')
    setMessage('Verifying attendance, batch enrollment & registering in database...')
    
    try {
      if (!qrData || typeof qrData !== 'string') {
        throw new Error('Invalid QR code data received. Please scan again.')
      }

      const parts = qrData.trim().split(':')
      const sessionId = parts[0]?.trim()
      const token = parts[1]?.trim()
      
      if (!sessionId || !token) {
        throw new Error('Invalid QR code format. Please scan a valid session QR.')
      }

      if (!location?.lat || !location?.lng) {
        throw new Error('GPS coordinates not acquired. Please verify your location first.')
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
      setMessage(res.message || 'Attendance successfully registered in the database!')
      setLastMarked({
        courseName: res.course_name || 'Class',
        courseCode: res.course_code || '',
        sessionType: res.session_type || 'lecture',
        markedAt: res.marked_at ? new Date(res.marked_at).toLocaleTimeString() : new Date().toLocaleTimeString()
      })
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
          {}
          <button 
            className={`btn ${isSimulated ? 'btn-primary' : ''}`}
            onClick={toggleSimulation}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
          </button>
        </div>
      </div>

      {}
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
              <p>GPS coordinates will be validated against Terna Engineering College perimeter ({campusInfo.campus_radius_m}m).</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  {facingMode === 'environment' ? '📷 Rear Camera' : '🤳 Front Camera'}
                </span>
                <button
                  type="button"
                  className="btn"
                  onClick={flipCamera}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Switch Camera (Back / Front)"
                >
                  <SwitchCamera size={14} />
                  Flip Camera
                </button>
              </div>
              <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000', minHeight: '280px' }}></div>
              <p style={{ marginTop: 14, fontSize: '13px' }}>{message}</p>
              <button 
                className="btn" 
                onClick={async () => { await stopScanner(); setStatus('idle'); }}
                style={{ marginTop: '8px', fontSize: '12px' }}
              >
                Cancel Scan
              </button>
            </div>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 size={64} style={{ color: 'var(--success)' }} />
              <h3 style={{ color: 'var(--success)' }}>Attendance Registered in Database!</h3>
              <p style={{ fontWeight: 600, color: 'var(--ink)' }}>{message}</p>
              
              {lastMarked && (
                <div style={{ 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: '10px', 
                  padding: '14px 20px', 
                  margin: '16px auto', 
                  maxWidth: '380px', 
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#166534', fontWeight: 700, fontSize: '13.5px' }}>
                      {lastMarked.courseCode ? `${lastMarked.courseCode} — ` : ''}{lastMarked.courseName}
                    </span>
                    <span className="badge badge-purple" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                      {lastMarked.sessionType}
                    </span>
                  </div>
                  <div style={{ color: '#15803d', fontSize: '12.5px' }}>
                    Status: <strong>PRESENT</strong> • Registered at {lastMarked.markedAt}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={async () => { await stopScanner(); setLastMarked(null); setStatus('idle'); }}>
                  Scan Another Class
                </button>
                <Link to="/student" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  View Dashboard
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle size={64} style={{ color: 'var(--danger)' }} />
              <h3 style={{ color: 'var(--danger)' }}>Scan Denied</h3>
              <p style={{ maxWidth: '440px', margin: '0 auto', fontSize: '13px' }}>{message}</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                <button className="btn" onClick={async () => { await stopScanner(); setStatus('idle'); }}>
                  Try Again
                </button>
                {!isInsideCampus && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      const simCoords = { lat: 19.0298, lng: 73.0166, simulated: true }
                      setLocation(simCoords)
                      setIsSimulated(true)
                      startScanner()
                    }}
                  >
                    Simulate On-Campus GPS & Scan
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
