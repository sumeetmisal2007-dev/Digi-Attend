import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

export default function FacultyClasses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await apiFetch(`/faculty/${user.id}/courses`)
        setCourses(data)
      } catch (err) {
        console.error('Failed to load classes', err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) loadCourses()
  }, [user])

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Classes</h1>
          <p>Courses assigned to you this semester</p>
        </div>
      </div>
      <div className="card">
        {loading ? (
          <p style={{ padding: '16px' }}>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p style={{ padding: '16px' }}>No courses assigned to you.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Semester</th>
                <th>Year</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => {
                const isPractical = c.code.endsWith('L') || c.name.toLowerCase().includes('practical')
                return (
                  <tr key={c.id || c.code}>
                    <td><span className="course-badge">{c.code}</span></td>
                    <td><strong>{c.name}</strong></td>
                    <td>Sem {c.semester}</td>
                    <td>Year {c.year}</td>
                    <td>
                      <span className={`badge ${isPractical ? 'badge-purple' : 'badge-blue'}`}>
                        {isPractical ? 'Practical' : 'Lecture / Core'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link 
                          to="/faculty/session/new" 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <PlusCircle size={14} /> Start Session
                        </Link>
                        <Link 
                          to="/faculty/attendance" 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FileText size={14} /> Attendance
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
