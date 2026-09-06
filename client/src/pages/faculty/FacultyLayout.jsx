import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { LayoutDashboard, BookOpen, CalendarDays, FileText } from 'lucide-react'

const navItems = [
  { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/faculty/classes', icon: BookOpen, label: 'My Classes' },
  { to: '/faculty/session/new', icon: CalendarDays, label: 'Create Session' },
  { to: '/faculty/attendance', icon: FileText, label: 'Edit Attendance' },
]

export default function FacultyLayout() {
  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
