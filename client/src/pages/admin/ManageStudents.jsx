import { Search, UserPlus } from 'lucide-react'
import PlaceholderCard from '../../components/PlaceholderCard'

const mockStudents = [
  { roll: 'TU4F2526035', name: 'Aarav Mehta', year: 2, semester: 3, status: 'Active' },
  { roll: 'TU4F2526036', name: 'Priya Sharma', year: 2, semester: 3, status: 'Active' },
  { roll: 'TU4F2526037', name: 'Rahul Patel', year: 2, semester: 3, status: 'Active' },
  { roll: 'TU4F2526038', name: 'Sneha Gupta', year: 3, semester: 5, status: 'Active' },
  { roll: 'TU4F2526039', name: 'Vikash Kumar', year: 3, semester: 5, status: 'Inactive' },
]

export default function ManageStudents() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Manage Students</h1>
          <p>Add, edit, or deactivate student accounts</p>
        </div>
        <button className="btn btn-primary" disabled>
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search by name or roll number..." disabled />
          </div>
          <select className="form-input form-input-sm" disabled>
            <option>All Years</option>
            <option>Year 1</option>
            <option>Year 2</option>
            <option>Year 3</option>
            <option>Year 4</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Name</th>
              <th>Year</th>
              <th>Semester</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockStudents.map((s) => (
              <tr key={s.roll}>
                <td>{s.roll}</td>
                <td><strong>{s.name}</strong></td>
                <td>Year {s.year}</td>
                <td>Sem {s.semester}</td>
                <td>
                  <span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                    {s.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm" disabled>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PlaceholderCard
        title="Student Management Coming Soon"
        message="Admins will be able to add, edit, and deactivate student accounts and manage course enrollments."
      />
    </>
  )
}
