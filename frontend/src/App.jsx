import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage from './pages/LoginPage'

import { LayoutDashboard, BarChart3, QrCode, BookOpen, CalendarDays, FileText, Users } from 'lucide-react'
import AppLayout from './components/AppLayout'

import StudentDashboard from './pages/student/StudentDashboard'
import StudentAnalysis from './pages/student/StudentAnalysis'
import StudentScanner from './pages/student/StudentScanner'

import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyClasses from './pages/faculty/FacultyClasses'
import CreateSession from './pages/faculty/CreateSession'
import SessionQR from './pages/faculty/SessionQR'
import EditAttendance from './pages/faculty/EditAttendance'

import HodDashboard from './pages/hod/HodDashboard'

import AdminDashboard from './pages/admin/AdminDashboard'
import ManageStudents from './pages/admin/ManageStudents'
import ManageCourses from './pages/admin/ManageCourses'

const studentNav = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/student/scan', icon: QrCode, label: 'Scan QR' },
]

const facultyNav = [
  { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/faculty/classes', icon: BookOpen, label: 'My Classes' },
  { to: '/faculty/session/new', icon: CalendarDays, label: 'Create Session' },
  { to: '/faculty/attendance', icon: FileText, label: 'Edit Attendance' },
]

const hodNav = facultyNav.map((n) => ({
  ...n,
  to: n.to.replace('/faculty', '/hod'),
  label: n.to === '/faculty' ? 'Department' : n.label,
}))

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
]

const sharedClassRoutes = (
  <>
    <Route path="classes" element={<FacultyClasses />} />
    <Route path="session/new" element={<CreateSession />} />
    <Route path="session/:id" element={<SessionQR />} />
    <Route path="attendance" element={<EditAttendance />} />
  </>
)

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:portalRole" element={<LoginPage />} />

        {/* Student routes */}
        <Route path="/student" element={<RequireAuth><AppLayout navItems={studentNav} /></RequireAuth>}>
          <Route index element={<StudentDashboard />} />
          <Route path="analysis" element={<StudentAnalysis />} />
          <Route path="scan" element={<StudentScanner />} />
        </Route>

        {/* Faculty routes */}
        <Route path="/faculty" element={<RequireAuth><AppLayout navItems={facultyNav} /></RequireAuth>}>
          <Route index element={<FacultyDashboard />} />
          {sharedClassRoutes}
        </Route>

        {/* HOD routes */}
        <Route path="/hod" element={<RequireAuth><AppLayout navItems={hodNav} /></RequireAuth>}>
          <Route index element={<HodDashboard />} />
          {sharedClassRoutes}
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<RequireAuth><AppLayout navItems={adminNav} /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="courses" element={<ManageCourses />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
