const mockCourses = [
  { code: 'IT301', name: 'Data Structures', semester: 3, type: 'Lecture', students: 48, sessions: 40 },
  { code: 'IT301L', name: 'Data Structures Lab', semester: 3, type: 'Practical', students: 48, sessions: 14 },
  { code: 'IT302', name: 'Database Management', semester: 3, type: 'Lecture', students: 45, sessions: 38 },
  { code: 'IT302L', name: 'Database Management Lab', semester: 3, type: 'Practical', students: 45, sessions: 13 },
]

export default function FacultyClasses() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>My Classes</h1>
          <p>Courses assigned to you this semester</p>
        </div>
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Name</th>
              <th>Semester</th>
              <th>Type</th>
              <th>Students</th>
              <th>Sessions</th>
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
                <td>{c.students}</td>
                <td>{c.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
