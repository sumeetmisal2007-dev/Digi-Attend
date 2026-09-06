import { Plus } from 'lucide-react'
import PlaceholderCard from '../../components/PlaceholderCard'

const mockCourses = [
  { code: 'IT301', name: 'Data Structures', semester: 3, type: 'Lecture', faculty: 'Dr. Nisha Rao', students: 48 },
  { code: 'IT301L', name: 'Data Structures Lab', semester: 3, type: 'Practical', faculty: 'Dr. Nisha Rao', students: 48 },
  { code: 'IT302', name: 'Database Management', semester: 3, type: 'Lecture', faculty: 'Prof. Amit Desai', students: 45 },
  { code: 'IT303', name: 'Operating Systems', semester: 3, type: 'Lecture', faculty: 'Dr. Snehal Patil', students: 46 },
  { code: 'IT304', name: 'Computer Networks', semester: 5, type: 'Lecture', faculty: 'Prof. Amit Desai', students: 42 },
]

export default function ManageCourses() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Manage Courses</h1>
          <p>Add courses and assign faculty</p>
        </div>
        <button className="btn btn-primary" disabled>
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Name</th>
              <th>Semester</th>
              <th>Type</th>
              <th>Faculty</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCourses.map((c) => (
              <tr key={c.code}>
                <td><span className="course-badge">{c.code}</span></td>
                <td><strong>{c.name}</strong></td>
                <td>Sem {c.semester}</td>
                <td>
                  <span className={`badge ${c.type === 'Practical' ? 'badge-purple' : 'badge-blue'}`}>
                    {c.type}
                  </span>
                </td>
                <td>{c.faculty}</td>
                <td>{c.students}</td>
                <td>
                  <button className="btn btn-sm" disabled>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PlaceholderCard
        title="Course Management Coming Soon"
        message="Admins will be able to create courses, assign faculty, and manage student enrollments."
      />
    </>
  )
}
