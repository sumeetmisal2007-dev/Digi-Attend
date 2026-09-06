import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { pool } from './db.js'
import { generateToken, validateToken } from './utils/qr.js'
import { isWithinCampus } from './utils/geo.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// === AUTH ENDPOINT ===
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();
    // In case user typed letter 'O' instead of digit '0' in TU0F... or vice-versa
    const altUsername = cleanUsername.replace(/^TUO/i, 'TU0').replace(/^tuo/i, 'tu0');

    const result = await pool.query(
      `SELECT id, name, roll_number, role, department_id, year, semester 
       FROM users 
       WHERE (LOWER(roll_number) = LOWER($1) OR LOWER(roll_number) = LOWER($2)) 
         AND password = $3`,
      [cleanUsername, altUsername, cleanPassword]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid ID Number or Password' });
    }

    const user = result.rows[0];
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// === FACULTY ENDPOINTS ===

// Get courses assigned to a faculty
app.get('/api/faculty/:id/courses', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT c.* FROM courses c
       JOIN faculty_courses fc ON c.id = fc.course_id
       WHERE fc.faculty_id = $1`,
      [id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create a new session
app.post('/api/sessions', async (req, res) => {
  try {
    const { course_id, faculty_id, session_type, session_date, start_time, end_time } = req.body
    
    // Generate a random 32-byte secret for this session's QR rotation
    const qr_secret = crypto.randomBytes(32).toString('hex')
    
    const result = await pool.query(
      `INSERT INTO sessions 
       (course_id, faculty_id, session_type, session_date, start_time, end_time, qr_secret)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, qr_secret`,
      [course_id, faculty_id, session_type, session_date, start_time, end_time, qr_secret]
    )
    
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get session details and current QR token
app.get('/api/sessions/:id/qr', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT s.*, c.name as course_name, c.code as course_code 
       FROM sessions s 
       JOIN courses c ON s.course_id = c.id 
       WHERE s.id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }
    
    const session = result.rows[0]
    const token = generateToken(session.qr_secret)
    
    // Get live attendance count
    const attendanceResult = await pool.query(
      'SELECT COUNT(*) as count FROM attendance_records WHERE session_id = $1 AND status = $2',
      [id, 'present']
    )
    
    // Don't send the secret to the client, just the current token
    delete session.qr_secret
    
    res.json({
      session,
      token,
      attendanceCount: parseInt(attendanceResult.rows[0].count)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// === STUDENT ENDPOINTS ===

// Scan QR and mark attendance
app.post('/api/attendance/scan', async (req, res) => {
  try {
    const { student_id, session_id, token, lat, lng, device_fingerprint } = req.body
    
    // 1. Get session and student department info
    const sessionResult = await pool.query(
      `SELECT s.qr_secret, s.is_active, s.start_time, s.end_time, d.campus_lat, d.campus_lng, d.campus_radius_m
       FROM sessions s
       JOIN courses c ON s.course_id = c.id
       JOIN departments d ON c.department_id = d.id
       WHERE s.id = $1`,
      [session_id]
    )
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' })
    }
    
    const session = sessionResult.rows[0]
    
    if (!session.is_active) {
      return res.status(400).json({ error: 'Session is no longer active' })
    }
    
    // 2. Validate Geolocation
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location data is required' })
    }
    
    if (!isWithinCampus(lat, lng, session.campus_lat, session.campus_lng, session.campus_radius_m)) {
      return res.status(403).json({ error: 'You must be on campus to mark attendance' })
    }
    
    // 3. Validate Token
    if (!validateToken(session.qr_secret, token)) {
      return res.status(403).json({ error: 'Invalid or expired QR code. Please scan again.' })
    }
    
    // 4. Record attendance
    // Use upsert in case they already scanned
    await pool.query(
      `INSERT INTO attendance_records 
       (student_id, session_id, status, scan_lat, scan_lng, device_fingerprint)
       VALUES ($1, $2, 'present', $3, $4, $5)
       ON CONFLICT (student_id, session_id) 
       DO UPDATE SET 
         status = 'present', 
         scan_lat = EXCLUDED.scan_lat, 
         scan_lng = EXCLUDED.scan_lng,
         marked_at = NOW()`,
      [student_id, session_id, lat, lng, device_fingerprint]
    )
    
    res.json({ success: true, message: 'Attendance marked successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get student dashboard stats (simplified for prototype)
app.get('/api/student/:id/stats', async (req, res) => {
  res.json({
    attendanceRate: '74.3%',
    attended: 129,
    total: 174,
    enrolled: 5
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
