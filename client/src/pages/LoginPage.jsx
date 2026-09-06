import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, BookOpen, BarChart3, Settings } from 'lucide-react'

const roles = [
  { key: 'student', label: 'Student', desc: 'View attendance, scan QR codes', icon: GraduationCap, path: '/student', color: '#2f9e6e' },
  { key: 'faculty', label: 'Faculty', desc: 'Create sessions, generate QR codes', icon: BookOpen, path: '/faculty', color: '#4d85b3' },
  { key: 'hod', label: 'HOD', desc: 'Department analytics & faculty features', icon: BarChart3, path: '/hod', color: '#e17e51' },
  { key: 'admin', label: 'Admin', desc: 'Manage students, courses & users', icon: Settings, path: '/admin', color: '#8b5cf6' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (role) => {
    login(role.key)
    navigate(role.path)
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">T</span>
          <h1>Terna Engineering College</h1>
          <p>Digital Attendance System</p>
        </div>
        <p className="login-subtitle">Select your role to continue</p>
        <div className="role-grid">
          {roles.map((role) => (
            <button key={role.key} className="role-card" onClick={() => handleSelect(role)}>
              <span className="role-icon" style={{ background: role.color + '18', color: role.color }}>
                <role.icon size={24} />
              </span>
              <strong>{role.label}</strong>
              <span className="role-desc">{role.desc}</span>
            </button>
          ))}
        </div>
        <p className="login-note">Prototype mode — no password required</p>
      </div>
    </div>
  )
}
