import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { LayoutDashboard, BarChart3, QrCode } from 'lucide-react'

const navItems = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/student/scan', icon: QrCode, label: 'Scan QR' },
]

export default function StudentLayout() {
  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
