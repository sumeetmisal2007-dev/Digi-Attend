import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../utils/api'

export default function CreateSession() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    course_id: '',
    session_type: 'lecture',
    batch: 'all',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00'
  })

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await apiFetch(`/faculty/${user.id}/courses`)
        setCourses(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, course_id: data[0].id }))
        }
      } catch (err) {
        console.error('Failed to load courses', err)
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) loadCourses()
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'session_type') {
      setFormData(prev => ({
        ...prev,
        session_type: value,
        batch: value === 'practical' ? (prev.batch === 'all' ? 'A1' : prev.batch) : 'all'
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.course_id) return
    
    setCreating(true)
    try {
      const session = await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          faculty_id: user.id
        })
      })
      navigate(`/faculty/session/${session.id}`)
    } catch (err) {
      console.error('Failed to create session', err)
      alert('Failed to create session')
      setCreating(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Create Session</h1>
          <p>Start a new attendance session and generate a QR code</p>
        </div>
      </div>

      <form className="card session-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Course</label>
          <select 
            name="course_id" 
            className="form-input" 
            value={formData.course_id}
            onChange={handleChange}
            disabled={loading || courses.length === 0}
            required
          >
            {loading ? <option>Loading courses...</option> : null}
            {!loading && courses.length === 0 ? <option>No courses assigned</option> : null}
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="session_date" 
              className="form-input" 
              value={formData.session_date}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label>Start Time</label>
            <input 
              type="time" 
              name="start_time" 
              className="form-input" 
              value={formData.start_time}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input 
              type="time" 
              name="end_time" 
              className="form-input" 
              value={formData.end_time}
              onChange={handleChange}
              required 
            />
          </div>
        </div>
        <div className="form-group">
          <label>Session Type</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="session_type" 
                value="lecture" 
                checked={formData.session_type === 'lecture'}
                onChange={handleChange}
              /> Lecture (All Batches)
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="session_type" 
                value="practical" 
                checked={formData.session_type === 'practical'}
                onChange={handleChange}
              /> Practical Lab
            </label>
          </div>
        </div>

        {formData.session_type === 'practical' && (
          <div className="form-group" style={{ background: 'var(--info-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>Practical Batch Restriction</span>
            </label>
            <p className="text-muted" style={{ fontSize: '12.5px', marginBottom: '12px' }}>
              Select the practical batch for this lab session. The scanner will strictly enforce batch enrollment:
            </p>
            <div className="radio-group" style={{ gap: '16px', flexWrap: 'wrap' }}>
              <label className="radio-label" style={{ fontWeight: 600 }}>
                <input 
                  type="radio" 
                  name="batch" 
                  value="A1" 
                  checked={formData.batch === 'A1'}
                  onChange={handleChange}
                /> Batch A1 <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>(Roll 1 – 36)</span>
              </label>
              <label className="radio-label" style={{ fontWeight: 600 }}>
                <input 
                  type="radio" 
                  name="batch" 
                  value="A2" 
                  checked={formData.batch === 'A2'}
                  onChange={handleChange}
                /> Batch A2 <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>(Roll 37 – 80)</span>
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="batch" 
                  value="all" 
                  checked={formData.batch === 'all'}
                  onChange={handleChange}
                /> All Batches <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>(Joint Lab)</span>
              </label>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || creating || !formData.course_id}
        >
          {creating ? 'Creating...' : 'Generate QR Code'}
        </button>
      </form>
    </>
  )
}
