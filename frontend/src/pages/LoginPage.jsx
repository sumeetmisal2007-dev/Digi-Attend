import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'
import ThemeToggle from '../components/ThemeToggle'
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react'

const PORTALS = {
  student: {
    id: 'student',
    tabLabel: 'Student',
    title: 'Student Attendance Portal',
    subtitle: 'Track your personal attendance %, view class timetables, and scan live lecture QR codes.',
    badge: 'Student Sign In',
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    bgTint: '#f0f9ff',
    borderTint: '#bae6fd',
    icon: GraduationCap,
    idLabel: 'Student PRN / Roll Number',
    idPlaceholder: 'e.g. TU4F2526001',
    passwordPlaceholder: 'Tu4@f2526001',
    demo: {
      username: 'TU4F2526030',
      password: 'Tu4@f2526030',
      label: 'Kamble Sanchi Maroti'
    },
    quickStudents: [
      { id: 'TU4F2526030', pass: 'Tu4@f2526030', name: 'Sanchi Kamble' },
      { id: 'TU4F2526035', pass: 'Tu4@f2526035', name: 'Siddhesh Choudhari' },
      { id: 'TU4F2526039', pass: 'Tu4@f2526039', name: 'Sumeet Misal' }
    ],
    features: ['Real-time Attendance %', 'Geo-verified QR Scanner', 'Semester 3 Subjects']
  },
  faculty: {
    id: 'faculty',
    tabLabel: 'Teacher',
    title: 'Teacher / Faculty Portal',
    subtitle: 'Launch dynamic rotating QR codes for your lectures & practicals and review student attendance.',
    badge: 'Teaching Faculty',
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    bgTint: '#eff6ff',
    borderTint: '#bfdbfe',
    icon: BookOpen,
    idLabel: 'Teacher ID / Faculty Code',
    idPlaceholder: 'e.g. TUTF2526001 or TUTF2526002',
    passwordPlaceholder: 'Tut@f2526001',
    demo: {
      username: 'TUTF2526001',
      password: 'Tut@f2526001',
      label: 'Dakshata Shinde (Operating System)'
    },
    features: ['Dynamic Rotating QR Codes', 'Lecture & Lab Attendance', 'Student Headcount Tracker']
  },
  hod: {
    id: 'hod',
    tabLabel: 'HOD',
    title: 'Head of Department (HOD) Portal',
    subtitle: 'Department-level attendance analytics, teacher class monitoring, and defaulter tracking.',
    badge: 'Head of Department',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    bgTint: '#faf5ff',
    borderTint: '#e9d5ff',
    icon: Award,
    idLabel: 'HOD Employee ID',
    idPlaceholder: 'e.g. TU0F2526001',
    passwordPlaceholder: 'Tu0@f2526001',
    demo: {
      username: 'TU0F2526001',
      password: 'Tu0@f2526001',
      label: 'Dr. Sujata Kadu (HOD IT)'
    },
    features: ['Department Analytics', 'Faculty Teaching Oversight', 'Course CNND In-charge']
  },
  admin: {
    id: 'admin',
    tabLabel: 'Admin',
    title: 'Administrative Console',
    subtitle: 'Manage faculty course allocations, student databases, and academic configurations.',
    badge: 'System Administrator',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    bgTint: '#fffbeb',
    borderTint: '#fde68a',
    icon: ShieldCheck,
    idLabel: 'Admin Username / Code',
    idPlaceholder: 'e.g. TUADF2526001',
    passwordPlaceholder: 'Tuad@f2526001',
    demo: {
      username: 'TUADF2526001',
      password: 'Tuad@f2526001',
      label: 'System Admin (Add 1)'
    },
    features: ['Manage 10 IT Courses', 'Master Student DB (80 Students)', 'System Administration']
  }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { portalRole } = useParams()
  const [searchParams] = useSearchParams()

  const initialRole = (() => {
    const fromParam = (portalRole || searchParams.get('role') || '').toLowerCase()
    return PORTALS[fromParam] ? fromParam : 'student'
  })()

  const [activeRole, setActiveRole] = useState(initialRole)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [expectedRole, setExpectedRole] = useState(null)
  const [loading, setLoading] = useState(false)

  // Keep state in sync if URL route changes
  useEffect(() => {
    const fromParam = (portalRole || searchParams.get('role') || '').toLowerCase()
    if (PORTALS[fromParam] && fromParam !== activeRole) {
      setActiveRole(fromParam)
      setError('')
      setExpectedRole(null)
    }
  }, [portalRole, searchParams])

  const currentPortal = PORTALS[activeRole] || PORTALS.student
  const PortalIcon = currentPortal.icon

  const handleRoleChange = (roleKey) => {
    setActiveRole(roleKey)
    setError('')
    setExpectedRole(null)
    navigate(`/login/${roleKey}`, { replace: true })
  }

  const fillDemo = () => {
    setUsername(currentPortal.demo.username)
    setPassword(currentPortal.demo.password)
    setError('')
    setExpectedRole(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setExpectedRole(null)
    setLoading(true)

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          username, 
          password,
          role: activeRole
        })
      })
      
      login(data.user, data.token)
      navigate(`/${data.user.role}`)
    } catch (err) {
      const errorMsg = err.message || 'Invalid ID Number or Password'
      setError(errorMsg)
      if (err.expectedRole) {
        setExpectedRole(err.expectedRole)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '20px', right: '24px', zIndex: 10 }}>
        <ThemeToggle variant="pill" />
      </div>
      <div className="login-card-wide">
        {/* Brand Header */}
        <div className="login-brand" style={{ marginBottom: 20 }}>
          <img 
            src="/terna-logo.png" 
            alt="Terna Logo" 
            style={{ height: '58px', maxWidth: '220px', objectFit: 'contain', marginBottom: '10px' }} 
          />
          <h1 style={{ fontSize: '20px' }}>Terna Engineering College</h1>
          <p>Digital Attendance & Academic Monitoring System</p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="portal-nav-bar" role="tablist">
          {Object.values(PORTALS).map((portal) => {
            const Icon = portal.icon
            const isActive = activeRole === portal.id
            return (
              <button
                key={portal.id}
                type="button"
                className={`portal-nav-btn ${isActive ? 'active' : ''}`}
                style={isActive ? { color: portal.color, borderColor: portal.color } : {}}
                onClick={() => handleRoleChange(portal.id)}
              >
                <Icon size={18} style={{ color: isActive ? portal.color : undefined }} />
                <span>{portal.tabLabel}</span>
              </button>
            )
          })}
        </div>

        {/* Dynamic Role Banner */}
        <div 
          className="portal-banner"
          style={{ 
            backgroundColor: currentPortal.bgTint, 
            borderColor: currentPortal.borderTint 
          }}
        >
          <div 
            className="portal-icon-wrapper"
            style={{ background: currentPortal.gradient }}
          >
            <PortalIcon size={24} />
          </div>
          <div className="portal-banner-content">
            <h2 style={{ color: currentPortal.color }}>
              {currentPortal.title}
            </h2>
            <p>{currentPortal.subtitle}</p>
            <div className="portal-features-list">
              {currentPortal.features.map((feat, i) => (
                <span key={i} className="portal-feature-tag">
                  <CheckCircle2 size={12} style={{ color: currentPortal.color }} />
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div className="alert-banner danger" style={{ fontSize: '13px' }}>
              <div>{error}</div>
              {expectedRole && PORTALS[expectedRole] && (
                <button
                  type="button"
                  onClick={() => {
                    handleRoleChange(expectedRole)
                    fillDemo()
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ffffff',
                    color: '#dc2626',
                    cursor: 'pointer'
                  }}
                >
                  Switch to {PORTALS[expectedRole].tabLabel} Portal &rarr;
                </button>
              )}
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: 600, fontSize: '13px' }}>
              {currentPortal.idLabel}
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={currentPortal.idPlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: 600, fontSize: '13px' }}>Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder={currentPortal.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="portal-submit-btn" 
            style={{ background: currentPortal.gradient }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : `Sign In to ${currentPortal.tabLabel} Portal`}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Demo Autofill Box */}
        <div className="demo-credentials-box">
          <div className="demo-header">
            <span>Sample {currentPortal.tabLabel} Credentials:</span>
            <button 
              type="button" 
              className="demo-fill-btn"
              onClick={fillDemo}
              title="Click to fill form with sample credentials"
            >
              <Sparkles size={12} />
              Auto-fill demo
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '11.5px', marginBottom: currentPortal.quickStudents ? '8px' : 0 }}>
            <span><strong>User:</strong> {currentPortal.demo.username}</span>
            <span><strong>Pass:</strong> {currentPortal.demo.password}</span>
            <span><em>({currentPortal.demo.label})</em></span>
          </div>

          {currentPortal.quickStudents && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>Integrated students:</span>
              {currentPortal.quickStudents.map(qs => (
                <button
                  key={qs.id}
                  type="button"
                  onClick={() => {
                    setUsername(qs.id)
                    setPassword(qs.pass)
                    setError('')
                    setExpectedRole(null)
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid #bae6fd',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    cursor: 'pointer'
                  }}
                >
                  {qs.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
