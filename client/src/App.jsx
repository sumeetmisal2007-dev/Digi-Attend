import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage from './pages/LoginPage'

import StudentLayout from './pages/student/StudentLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentAnalysis from './pages/student/StudentAnalysis'
import StudentScanner from './pages/student/StudentScanner'

import FacultyLayout from './pages/faculty/FacultyLayout'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyClasses from './pages/faculty/FacultyClasses'
import CreateSession from './pages/faculty/CreateSession'
import SessionQR from './pages/faculty/SessionQR'
import EditAttendance from './pages/faculty/EditAttendance'

import HodLayout from './pages/hod/HodLayout'
import HodDashboard from './pages/hod/HodDashboard'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageStudents from './pages/admin/ManageStudents'
import ManageCourses from './pages/admin/ManageCourses'

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

        {/* Student routes */}
        <Route path="/student" element={<RequireAuth><StudentLayout /></RequireAuth>}>
          <Route index element={<StudentDashboard />} />
          <Route path="analysis" element={<StudentAnalysis />} />
          <Route path="scan" element={<StudentScanner />} />
        </Route>

        {/* Faculty routes */}
        <Route path="/faculty" element={<RequireAuth><FacultyLayout /></RequireAuth>}>
          <Route index element={<FacultyDashboard />} />
          <Route path="classes" element={<FacultyClasses />} />
          <Route path="session/new" element={<CreateSession />} />
          <Route path="session/:id" element={<SessionQR />} />
          <Route path="attendance" element={<EditAttendance />} />
        </Route>

        {/* HOD routes — reuses faculty page components */}
        <Route path="/hod" element={<RequireAuth><HodLayout /></RequireAuth>}>
          <Route index element={<HodDashboard />} />
          <Route path="classes" element={<FacultyClasses />} />
          <Route path="session/new" element={<CreateSession />} />
          <Route path="session/:id" element={<SessionQR />} />
          <Route path="attendance" element={<EditAttendance />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
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
