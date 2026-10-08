import { useState, useEffect } from 'react'
import { Plus, X, BookOpen, CheckCircle2, AlertCircle, Users } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [facultyList, setFacultyList] = useState([])
  const [loading, setLoading] = useState(true)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    year: 2,
    semester: 3,
    faculty_ids: []
  })
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [coursesData, facultyData] = await Promise.all([
        apiFetch('/courses'),
        apiFetch('/faculty')
      ])
      setCourses(coursesData)
      setFacultyList(facultyData)
    } catch (err) {
      console.error('Failed to load courses data', err)
      setNotification({ type: 'danger', text: 'Failed to load courses from database' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openAddModal = () => {
    setFormData({
      code: '',
      name: '',
      year: 2,
      semester: 3,
      faculty_ids: facultyList.length > 0 ? [facultyList[0].id || facultyList[0]._id] : []
    })
    setIsAddOpen(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotification(null)
    try {
      await apiFetch('/courses', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      setIsAddOpen(false)
      setNotification({ type: 'success', text: `Course ${formData.code} created successfully!` })
      loadData()
    } catch (err) {
      setNotification({ type: 'danger', text: err.message || 'Error creating course' })
    } finally {
      setSaving(false)
    }
  }

  const toggleFaculty = (fId) => {
    setFormData(prev => {
      const exists = prev.faculty_ids.includes(fId)
      return {
        ...prev,
        faculty_ids: exists
          ? prev.faculty_ids.filter(id => id !== fId)
          : [...prev.faculty_ids, fId]
      }
    })
  }

  return (
    <>
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Manage Courses</h1>
          <p>Academic Course Catalog & Faculty Allocations (Information Technology)</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      {notification && (
        <div className={`alert-banner ${notification.type}`} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            Loading course catalog from MongoDB...
          </p>
        ) : courses.length === 0 ? (
          <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            No courses found in database.
          </p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Semester & Year</th>
                  <th>Classification</th>
                  <th>Assigned Faculty</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const isPractical = c.code.endsWith('L') || c.name.toLowerCase().includes('practical')
                  const facultyNames = (c.faculty_ids || []).map(f => f.name).join(', ') || 'Unassigned'
                  return (
                    <tr key={c.id || c._id || c.code}>
                      <td><span className="course-badge">{c.code}</span></td>
                      <td><strong>{c.name}</strong></td>
                      <td>Sem {c.semester} (Year {c.year})</td>
                      <td>
                        <span className={`badge ${isPractical ? 'badge-purple' : 'badge-blue'}`}>
                          {isPractical ? 'Practical Lab' : 'Theory Core'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: facultyNames === 'Unassigned' ? 'var(--danger)' : 'var(--ink)' }}>
                          {facultyNames}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--ink-soft)' }}>
              <span>Total Active Courses: <strong>{courses.length}</strong></span>
              <span>Connected to MongoDB Backend</span>
            </div>
          </>
        )}
      </div>

      {}
      {isAddOpen && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Add New Course</h2>
              <button 
                type="button" 
                onClick={() => setIsAddOpen(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Course Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. IT309 or IT309L"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Course Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Cloud Computing & DevOps"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Academic Year</label>
                  <select 
                    className="form-input" 
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Semester</label>
                  <select 
                    className="form-input" 
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  >
                    <option value={1}>Sem 1</option>
                    <option value={2}>Sem 2</option>
                    <option value={3}>Sem 3</option>
                    <option value={4}>Sem 4</option>
                    <option value={5}>Sem 5</option>
                    <option value={6}>Sem 6</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} /> Allocate Faculty In-Charge
                </label>
                <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
                  {facultyList.map(f => (
                    <label key={f.id || f._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.faculty_ids.includes(f.id || f._id)}
                        onChange={() => toggleFaculty(f.id || f._id)}
                      />
                      <span><strong>{f.name}</strong> ({f.roll_number})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px'
}

const modalContentStyle = {
  width: '100%',
  maxWidth: '480px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  background: '#ffffff',
  borderRadius: '12px',
  padding: '24px'
}
