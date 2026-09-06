import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../utils/api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      
      login(data.user)
      
      // Navigate to respective dashboard
      navigate(`/${data.user.role}`)
      
    } catch (err) {
      setError(err.message || 'Invalid ID Number or Password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card" style={{ maxWidth: 400 }}>
        <div className="login-brand">
          <span className="brand-mark">T</span>
          <h1>Terna Engineering College</h1>
          <p>Digital Attendance System</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div className="alert-banner danger">{error}</div>}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>ID Number (Username)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. TU4F2526001"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
