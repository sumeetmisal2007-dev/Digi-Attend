import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { LayoutDashboard, BookOpen, CalendarDays, FileText } from 'lucide-react'

const navItems = [
  { to: '/hod', icon: LayoutDashboard, label: 'Department', end: true },
  { to: '/hod/classes', icon: BookOpen, label: 'My Classes' },
  { to: '/hod/session/new', icon: CalendarDays, label: 'Create Session' },
  { to: '/hod/attendance', icon: FileText, label: 'Edit Attendance' },
]

export default function HodLayout() {
  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
