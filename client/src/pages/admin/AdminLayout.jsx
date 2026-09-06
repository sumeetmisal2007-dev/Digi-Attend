import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { LayoutDashboard, Users, BookOpen } from 'lucide-react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
]

export default function AdminLayout() {
  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
