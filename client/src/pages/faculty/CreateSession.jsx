import PlaceholderCard from '../../components/PlaceholderCard'

export default function CreateSession() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Create Session</h1>
          <p>Start a new attendance session and generate a QR code</p>
        </div>
      </div>

      <div className="card session-form">
        <div className="form-group">
          <label>Course</label>
          <select className="form-input" disabled>
            <option>IT301 — Data Structures</option>
            <option>IT301L — Data Structures Lab</option>
            <option>IT302 — Database Management</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-input" disabled />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" className="form-input" disabled />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" className="form-input" disabled />
          </div>
        </div>
        <div className="form-group">
          <label>Session Type</label>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" name="type" value="lecture" defaultChecked disabled /> Lecture
            </label>
            <label className="radio-label">
              <input type="radio" name="type" value="practical" disabled /> Practical
            </label>
          </div>
        </div>
        <button className="btn btn-primary" disabled>Generate QR Code</button>
      </div>

      <PlaceholderCard
        title="QR Generation Coming Soon"
        message="This form will create a real session and generate a rotating QR code in the next phase."
      />
    </>
  )
}
