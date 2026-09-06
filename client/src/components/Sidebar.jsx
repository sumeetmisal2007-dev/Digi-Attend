import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ navItems }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <img src="/terna-logo.png" alt="Terna" style={{ height: '32px', maxWidth: '100%', objectFit: 'contain' }} />
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
        <button className="sidebar-link" onClick={handleLogout}>
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
