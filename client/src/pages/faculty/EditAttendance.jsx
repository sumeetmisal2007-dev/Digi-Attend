import PlaceholderCard from '../../components/PlaceholderCard'

const mockRecords = [
  { roll: 'TU4F2526035', name: 'Aarav Mehta', status: 'present' },
  { roll: 'TU4F2526036', name: 'Priya Sharma', status: 'present' },
  { roll: 'TU4F2526037', name: 'Rahul Patel', status: 'absent' },
  { roll: 'TU4F2526038', name: 'Sneha Gupta', status: 'present' },
  { roll: 'TU4F2526039', name: 'Vikash Kumar', status: 'late' },
]

export default function EditAttendance() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Edit Attendance</h1>
          <p>Modify attendance records — changes allowed within 30 days of session date</p>
        </div>
      </div>

      <div className="card">
        <div className="form-row" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Course</label>
            <select className="form-input" disabled>
              <option>IT301 — Data Structures</option>
            </select>
          </div>
          <div className="form-group">
            <label>Session Date</label>
            <input type="date" className="form-input" disabled />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockRecords.map((r) => (
              <tr key={r.roll}>
                <td>{r.roll}</td>
                <td><strong>{r.name}</strong></td>
                <td>
                  <span className={`badge ${
                    r.status === 'present' ? 'badge-green' :
                    r.status === 'absent' ? 'badge-red' : 'badge-yellow'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <select className="form-input form-input-sm" disabled defaultValue={r.status}>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" disabled>Save Changes</button>
        </div>
      </div>

      <PlaceholderCard
        title="Edit Feature Coming Soon"
        message="Faculty will be able to modify attendance records within 30 days of the session date."
      />
    </>
  )
}
