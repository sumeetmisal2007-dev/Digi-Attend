import { useState, useEffect } from 'react'
import { Search, UserPlus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Lock, Unlock, RotateCcw, Smartphone } from 'lucide-react'
import { apiFetch } from '../../utils/api'

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    batch: 'A1',
    year: 2,
    semester: 3,
    password: ''
  })

  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null) 

  const loadStudents = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (search.trim()) query.set('search', search.trim())
      if (yearFilter !== 'all') query.set('year', yearFilter)

      const data = await apiFetch(`/students?${query.toString()}`)
      setStudents(data)
    } catch (err) {
      console.error('Failed to load students', err)
      setNotification({ type: 'danger', text: 'Failed to load students from database' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, yearFilter])

  const openAddModal = () => {
    setFormData({
      roll_number: '',
      name: '',
      batch: 'A1',
      year: 2,
      semester: 3,
      password: ''
    })
    setIsAddOpen(true)
  }

  const openEditModal = (s) => {
    setEditingStudent(s)
    setFormData({
      roll_number: s.roll_number,
      name: s.name,
      batch: s.batch || 'A1',
      year: s.year || 2,
      semester: s.semester || 3,
      is_active: s.is_active !== false
    })
  }

  const handleResetDevice = async (studentId, studentName) => {
    if (!window.confirm(`Reset smartphone hardware lock for ${studentName}?\n\nThis student will be permitted to register a new smartphone on their next attendance scan.`)) return
    try {
      const res = await apiFetch(`/students/${studentId}/reset-device`, { method: 'POST' })
      setNotification({ type: 'success', text: res.message })
      loadStudents()
    } catch (err) {
      setNotification({ type: 'danger', text: err.message || 'Failed to reset device lock' })
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotification(null)
    try {
      await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      setIsAddOpen(false)
      setNotification({ type: 'success', text: `Student ${formData.name} added successfully!` })
      loadStudents()
    } catch (err) {
      setNotification({ type: 'danger', text: err.message || 'Error creating student' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingStudent) return
    setSaving(true)
    setNotification(null)
    try {
      await apiFetch(`/students/${editingStudent.id || editingStudent._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      setEditingStudent(null)
      setNotification({ type: 'success', text: `Student ${formData.name} updated successfully!` })
      loadStudents()
    } catch (err) {
      setNotification({ type: 'danger', text: err.message || 'Error updating student' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}"?`)) return
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' })
      setNotification({ type: 'success', text: `Student ${name} removed.` })
      loadStudents()
    } catch (err) {
      setNotification({ type: 'danger', text: err.message || 'Error deleting student' })
    }
  }

  return (
    <>
      <div className="page-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Manage Students</h1>
          <p>Master Student Database (Terna Engineering College — IT Department)</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      {notification && (
        <div className={`alert-banner ${notification.type}`} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="card">
        <div className="table-toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search by student name or roll number (e.g. KARMAT or TU4F)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="form-input form-input-sm" 
            style={{ width: 'auto' }}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All Academic Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2 (Semester 3)</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>

        {loading ? (
          <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            Loading student records from MongoDB...
          </p>
        ) : students.length === 0 ? (
          <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            No students found matching your search.
          </p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll / ID Number</th>
                  <th>Batch</th>
                  <th>Student Name</th>
                  <th>Year & Semester</th>
                  <th>Hardware Lock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id || s._id}>
                    <td><span className="course-badge">{s.roll_number}</span></td>
                    <td>
                      <span className="badge badge-purple" style={{ fontWeight: 700, fontSize: '11px' }}>
                        {s.batch || 'A1'}
                      </span>
                    </td>
                    <td><strong>{s.name}</strong></td>
                    <td>Year {s.year || 2} (Sem {s.semester || 3})</td>
                    <td>
                      {s.device_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span 
                            className="badge" 
                            style={{ 
                              background: '#fef2f2', 
                              color: '#dc2626', 
                              borderColor: '#fecaca', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                            title={`Device ID: ${s.device_id}`}
                          >
                            <Lock size={11} /> Bound
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleResetDevice(s.id || s._id, s.name)}
                            style={{ padding: '2px 6px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Reset hardware lock so student can link a new smartphone"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        </div>
                      ) : (
                        <span 
                          className="badge" 
                          style={{ 
                            background: '#f8fafc', 
                            color: '#64748b', 
                            borderColor: '#cbd5e1', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontSize: '11px'
                          }}
                        >
                          <Unlock size={11} /> Unbound
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                        {s.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-sm" 
                          onClick={() => openEditModal(s)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button 
                          className="btn btn-sm" 
                          onClick={() => handleDelete(s.id || s._id, s.name)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--ink-soft)' }}>
              <span>Total students loaded: <strong>{students.length}</strong></span>
              <span>All records synced with MongoDB database</span>
            </div>
          </>
        )}
      </div>

      {}
      {isAddOpen && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Add New Student</h2>
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
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Student Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. PATIL AAKASH SURESH"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Roll Number / Student ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. TU4F2526081"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Practical Batch</label>
                  <select 
                    className="form-input" 
                    value={formData.batch || 'A1'}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  >
                    <option value="A1">Batch A1 (Roll 1 – 36)</option>
                    <option value="A2">Batch A2 (Roll 37 – 80)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Year</label>
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
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Initial Password (optional)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Defaults to roll number"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {editingStudent && (
        <div style={modalOverlayStyle}>
          <div className="card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Edit Student</h2>
              <button 
                type="button" 
                onClick={() => setEditingStudent(null)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Student Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Roll Number / ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Practical Batch</label>
                  <select 
                    className="form-input" 
                    value={formData.batch || 'A1'}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  >
                    <option value="A1">Batch A1 (Roll 1 – 36)</option>
                    <option value="A2">Batch A2 (Roll 37 – 80)</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Year</label>
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

              {}
              <div className="form-group" style={{ marginBottom: 0, background: 'var(--bg)', padding: '12px', borderRadius: '8px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hardware Binding (Anti-Proxy Lock)</label>
                {editingStudent.device_id ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={12} /> Smartphone Bound
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-soft)', display: 'block' }}>
                        ID: {editingStudent.device_id.slice(0, 24)}...
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleResetDevice(editingStudent.id || editingStudent._id, editingStudent.name)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={12} /> Reset Hardware Lock
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Unlock size={12} /> No smartphone bound yet (will auto-bind on next scan)
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Account Active (Allowed to log in and mark attendance)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn" onClick={() => setEditingStudent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
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
  maxWidth: '460px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  background: '#ffffff',
  borderRadius: '12px',
  padding: '24px'
}
