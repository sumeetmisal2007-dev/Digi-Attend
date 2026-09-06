import { CheckCircle2, AlertTriangle } from 'lucide-react'

const REQUIRED_PCT = 75

const subjects = [
  { name: 'Data Structures', type: 'Lecture', attended: 34, total: 40 },
  { name: 'Data Structures Lab', type: 'Practical', attended: 12, total: 14 },
  { name: 'Operating Systems', type: 'Lecture', attended: 21, total: 32 },
  { name: 'Database Management', type: 'Lecture', attended: 29, total: 38 },
  { name: 'Database Management Lab', type: 'Practical', attended: 10, total: 13 },
  { name: 'Computer Networks', type: 'Lecture', attended: 18, total: 30 },
  { name: 'Software Engineering', type: 'Lecture', attended: 27, total: 34 },
]

function pct(attended, total) {
  return total === 0 ? 0 : (attended / total) * 100
}

function classesNeeded(attended, total) {
  const target = REQUIRED_PCT / 100
  if (pct(attended, total) >= REQUIRED_PCT) return 0
  return Math.ceil((target * total - attended) / (1 - target))
}

export default function StudentAnalysis() {
  const totalAttended = subjects.reduce((s, x) => s + x.attended, 0)
  const totalClasses = subjects.reduce((s, x) => s + x.total, 0)
  const overall = pct(totalAttended, totalClasses)
  const overallLow = overall < REQUIRED_PCT

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Attendance Analysis</h1>
          <p>Detailed breakdown by subject — Lectures and Practicals tracked separately</p>
        </div>
      </div>

      <div className="card overall-banner">
        <div>
          <span className="text-muted">Overall Attendance</span>
          <strong className={`overall-pct ${overallLow ? 'low' : 'ok'}`}>
            {overall.toFixed(1)}%
          </strong>
          <span className="text-muted">{totalAttended} of {totalClasses} classes</span>
        </div>
        {overallLow ? (
          <div className="alert-banner danger">
            <AlertTriangle size={16} />
            Attend the next {classesNeeded(totalAttended, totalClasses)} classes to reach 75%
          </div>
        ) : (
          <div className="alert-banner success">
            <CheckCircle2 size={16} />
            You meet the 75% attendance requirement
          </div>
        )}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Type</th>
              <th>Attended</th>
              <th>Total</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => {
              const p = pct(s.attended, s.total)
              const low = p < REQUIRED_PCT
              const need = classesNeeded(s.attended, s.total)
              return (
                <tr key={i}>
                  <td><strong>{s.name}</strong></td>
                  <td>
                    <span className={`badge ${s.type === 'Practical' ? 'badge-purple' : 'badge-blue'}`}>
                      {s.type}
                    </span>
                  </td>
                  <td>{s.attended}</td>
                  <td>{s.total}</td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${low ? 'low' : 'ok'}`}
                          style={{ width: `${Math.min(p, 100)}%` }}
                        />
                      </div>
                      <span>{p.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    {low
                      ? <span className="text-danger">Need {need} more</span>
                      : <span className="text-success">On track</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
