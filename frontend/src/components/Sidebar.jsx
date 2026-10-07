import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import ChangePasswordModal from './ChangePasswordModal'

export default function Sidebar({ navItems }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2) || '?'

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <img src="/terna-logo.png" alt="Terna" style={{ height: '38px', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-name">{user?.name}</div>
            <div className="sidebar-role">{user?.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--sidebar-text)', fontWeight: 500 }}>Theme</span>
            <ThemeToggle variant="compact" />
          </div>
          <button 
            className="sidebar-link" 
            onClick={() => setIsPasswordModalOpen(true)}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
          >
            <KeyRound size={18} />
            Change Password
          </button>
          <button className="sidebar-link" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </>
  )
}
