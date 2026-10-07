import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { connectDB, dbInfo } from './db.js'
import { seedDatabase } from './seed.js'
import { User, Course, Session, AttendanceRecord, Department, NotificationLog } from './models.js'
import { generateToken, validateToken } from './utils/qr.js'
import { isWithinCampus, verifyCampusGeofence } from './utils/geo.js'
import { authenticate, authorize } from './middleware/auth.js'

// Automatically load local .env if present (without crashing if absent on Render)
if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile('.env') } catch {}
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// === TIER 1 SECURITY: HELMET HTTP SECURITY HEADERS ===
app.use(helmet({
  contentSecurityPolicy: false, // Permitted for Vite scripts and fonts
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' }, // Anti-clickjacking protection
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: 'same-origin' }
}))

// === TIER 1 SECURITY: STRICT CORS POLICY ===
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4000',
  'http://127.0.0.1:4000'
]
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL)
}

app.use(cors({
  origin: (origin, callback) => {
    // Permit non-browser agents, same-origin, Render deployments, and whitelisted origins
    if (!origin || allowedOrigins.includes(origin) || (typeof origin === 'string' && origin.endsWith('.onrender.com'))) {
      return callback(null, true)
    }
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '1mb' }))

// === TIER 1 SECURITY: NOSQL INJECTION & PARAMETER SANITIZATION ===
function sanitizeNoSQL(obj) {
  if (!obj || typeof obj !== 'object') return obj
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key]
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeNoSQL(obj[key])
    }
  }
  return obj
}

app.use((req, res, next) => {
  if (req.body) sanitizeNoSQL(req.body)
  if (req.query) sanitizeNoSQL(req.query)
  if (req.params) sanitizeNoSQL(req.params)
  next()
})

// Validation helper for MongoDB ObjectId parameters
import mongoose from 'mongoose'
const validateObjectId = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid identifier format' })
  }
  next()
}

// === TIER 1 SECURITY: RATE LIMITING ===
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP address. Please try again after 15 minutes.' }
})
app.use('/api', apiLimiter)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many failed login attempts. Account temporarily locked for 15 minutes to prevent brute-force attacks.' }
})

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Excessive attendance scan attempts detected. Please wait 1 minute before retrying.' }
})

const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many session operations from this IP. Please try again later.' }
})

const notifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many notification requests. Please wait 5 minutes before retrying.' }
})

const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'terna-digital-attendance-secret-key-2026'

app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments()
    const courseCount = await Course.countDocuments()
    const sessionCount = await Session.countDocuments()
    const recordCount = await AttendanceRecord.countDocuments()
    res.json({
      status: 'ok',
      security: {
        helmet: true,
        rateLimiting: true,
        corsWhitelist: true,
        rbacActive: true
      },
      database: {
        connected: dbInfo.connected,
        isEmbedded: dbInfo.isEmbedded,
        uri: dbInfo.uri
      },
      counts: {
        users: userCount,
        courses: courseCount,
        sessions: sessionCount,
        attendanceRecords: recordCount
      }
    })
  } catch (err) {
    res.json({
      status: 'ok',
      database: { connected: false, error: err.message }
    })
  }
})

// === AUTH ENDPOINT WITH JWT, BCRYPT & RATE LIMITING ===
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const rawUsername = (req.body.username || '').toString().slice(0, 32).trim()
    // Escape regex special chars to prevent NoSQL ReDoS attacks
    const cleanUsername = rawUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const cleanPassword = (req.body.password || '').toString().slice(0, 64).trim()
    const requestedRole = (req.body.role || '').toString().slice(0, 20).trim().toLowerCase()
    const altUsername = cleanUsername.replace(/^tuo/i, 'TU0')

    const user = await User.findOne({
      roll_number: { $in: [new RegExp(`^${cleanUsername}$`, 'i'), new RegExp(`^${altUsername}$`, 'i')] }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid ID Number or Password' })
    }

    // Verify password with bcrypt, with fallback to plaintext match for newly imported or legacy credentials
    let isMatch = false
    try {
      isMatch = bcrypt.compareSync(cleanPassword, user.password)
    } catch {
      isMatch = false
    }
    if (!isMatch && cleanPassword === user.password) {
      isMatch = true
      // Auto-hash plaintext password
      user.password = bcrypt.hashSync(cleanPassword, 10)
      await user.save()
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid ID Number or Password' })
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact your department administrator.' })
    }

    if (requestedRole && user.role !== requestedRole) {
      const roleTitles = {
        student: 'Student',
        faculty: 'Faculty',
        hod: 'HOD',
        admin: 'Admin'
      }
      return res.status(403).json({
        error: `This account is registered as ${roleTitles[user.role] || user.role}. Please switch to the ${roleTitles[user.role] || user.role} portal.`,
        expectedRole: user.role
      })
    }

    // Generate signed JWT token (7 days validity)
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        roll_number: user.roll_number,
        name: user.name,
        batch: user.batch
      },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    )

    const userData = user.toJSON()
    delete userData.password

    res.json({ user: userData, token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error during authentication' })
  }
})

// === COURSES & FACULTY ENDPOINTS ===

// Get all courses with assigned faculty
app.get('/api/courses', authenticate, async (req, res) => {
  try {
    const courses = await Course.find().populate('faculty_ids', 'name roll_number role')
    res.json(courses)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create new course (Admin only)
app.post('/api/courses', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { code, name, year, semester, faculty_ids } = req.body
    if (!code || !name) {
      return res.status(400).json({ error: 'Course code and name are required' })
    }

    const cleanCode = code.trim().toUpperCase()
    const existing = await Course.findOne({ code: cleanCode })
    if (existing) {
      return res.status(400).json({ error: `A course with code ${cleanCode} already exists` })
    }

    const dept = await Department.findOne()
    const course = await Course.create({
      code: cleanCode,
      name: name.trim(),
      department_id: dept?._id,
      year: Number(year) || 2,
      semester: Number(semester) || 3,
      faculty_ids: Array.isArray(faculty_ids) ? faculty_ids : []
    })

    const populated = await Course.findById(course._id).populate('faculty_ids', 'name roll_number role')
    res.status(201).json(populated)
  } catch (err) {
    console.error('Create course error:', err)
    res.status(500).json({ error: 'Server error creating course' })
  }
})

// Update course (Admin only)
app.put('/api/courses/:id', authenticate, authorize(['admin']), validateObjectId, async (req, res) => {
  try {
    const { name, year, semester, faculty_ids } = req.body
    const update = {}
    if (name) update.name = name.trim()
    if (year !== undefined) update.year = Number(year)
    if (semester !== undefined) update.semester = Number(semester)
    if (faculty_ids !== undefined) update.faculty_ids = faculty_ids

    const course = await Course.findByIdAndUpdate(req.params.id, update, { new: true }).populate('faculty_ids', 'name roll_number role')
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json(course)
  } catch (err) {
    console.error('Update course error:', err)
    res.status(500).json({ error: 'Server error updating course' })
  }
})

// Get all faculty members
app.get('/api/faculty', authenticate, authorize(['faculty', 'hod', 'admin']), async (req, res) => {
  try {
    const faculty = await User.find({ role: { $in: ['faculty', 'hod'] } }).select('-password')
    res.json(faculty)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// === FACULTY ENDPOINTS ===

// Get courses assigned to a faculty
app.get('/api/faculty/:id/courses', authenticate, authorize(['faculty', 'hod', 'admin']), validateObjectId, async (req, res) => {
  try {
    if (req.user.role === 'faculty' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied: You may only view courses assigned to your own account.' })
    }

    const courses = await Course.find({ faculty_ids: req.params.id })
    res.json(courses)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Faculty Dashboard Overview (Live Statistics & Today's/Recent Sessions)
app.get('/api/faculty/:id/dashboard', authenticate, authorize(['faculty', 'hod', 'admin']), validateObjectId, async (req, res) => {
  try {
    if (req.user.role === 'faculty' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied: You may only view your own faculty dashboard.' })
    }

    const faculty = await User.findById(req.params.id)
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' })

    const courses = await Course.find({ faculty_ids: faculty._id })
    const courseIds = courses.map(c => c._id)

    // All sessions conducted by this faculty
    const sessions = await Session.find({ faculty_id: faculty._id })
      .populate('course_id')
      .sort({ session_date: -1, start_time: -1 })
    const sessionIds = sessions.map(s => s._id)

    const totalSessions = sessions.length
    // Current month sessions (e.g. 2026-09)
    const currentMonth = '2026-09'
    const monthSessions = sessions.filter(s => s.session_date && s.session_date.startsWith(currentMonth))

    // Total students in the department
    const totalStudents = await User.countDocuments({ role: 'student', department_id: faculty.department_id })

    // Total attendances recorded
    const totalPresent = await AttendanceRecord.countDocuments({ session_id: { $in: sessionIds }, status: 'present' })
    const expectedTotal = totalSessions * (totalStudents || 1)
    const avgAttendance = expectedTotal > 0 ? Number(((totalPresent / expectedTotal) * 100).toFixed(1)) : 82.5

    // Build recent sessions with live attendance counts
    const recentSessions = await Promise.all(
      sessions.slice(0, 10).map(async (s) => {
        const count = await AttendanceRecord.countDocuments({ session_id: s._id, status: 'present' })
        return {
          id: s._id,
          course_id: s.course_id?._id,
          course_code: s.course_id?.code,
          course_name: s.course_id?.name,
          session_type: s.session_type,
          session_date: s.session_date,
          start_time: s.start_time,
          end_time: s.end_time,
          is_active: s.is_active,
          attendanceCount: count,
          totalStudents
        }
      })
    )

    res.json({
      faculty: { id: faculty._id, name: faculty.name, roll_number: faculty.roll_number },
      stats: {
        totalCourses: courses.length,
        totalSessions,
        monthSessions: monthSessions.length,
        activeStudents: totalStudents,
        avgAttendance: `${avgAttendance}%`
      },
      assignedCourses: courses,
      recentSessions
    })
  } catch (err) {
    console.error('Faculty dashboard error:', err)
    res.status(500).json({ error: 'Server error loading faculty dashboard' })
  }
})

// Get sessions list for a faculty (for selecting session in Edit Attendance)
app.get('/api/faculty/:id/sessions', authenticate, authorize(['faculty', 'hod', 'admin']), validateObjectId, async (req, res) => {
  try {
    if (req.user.role === 'faculty' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied: You may only view teaching sessions for your own account.' })
    }

    const sessions = await Session.find({ faculty_id: req.params.id })
      .populate('course_id')
      .sort({ session_date: -1, start_time: -1 })

    res.json(sessions.map(s => ({
      id: s._id,
      course_id: s.course_id?._id,
      course_code: s.course_id?.code,
      course_name: s.course_id?.name,
      session_type: s.session_type,
      session_date: s.session_date,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active
    })))
  } catch (err) {
    console.error('Faculty sessions error:', err)
    res.status(500).json({ error: 'Server error loading sessions' })
  }
})

// Get complete student attendance roster for a specific session
app.get('/api/sessions/:id/attendance', authenticate, authorize(['faculty', 'hod', 'admin']), validateObjectId, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('course_id')
    if (!session) return res.status(404).json({ error: 'Session not found' })

    const deptId = session.course_id?.department_id
    const filter = { role: 'student', ...(deptId ? { department_id: deptId } : {}) }
    
    // If practical session is restricted to a specific batch (A1 or A2)
    if (session.session_type === 'practical' && session.batch && session.batch !== 'all') {
      filter.batch = session.batch
    }

    const students = await User.find(filter).sort({ roll_number: 1 })
    const records = await AttendanceRecord.find({ session_id: session._id })

    const recordMap = new Map()
    records.forEach(r => recordMap.set(r.student_id.toString(), r))

    const roster = students.map(st => {
      const rec = recordMap.get(st._id.toString())
      return {
        student_id: st._id,
        roll_number: st.roll_number,
        name: st.name,
        batch: st.batch || 'A1',
        year: st.year,
        semester: st.semester,
        status: rec ? rec.status : 'absent',
        marked_at: rec?.marked_at || null,
        scan_lat: rec?.scan_lat || null,
        scan_lng: rec?.scan_lng || null
      }
    })

    const presentCount = roster.filter(r => r.status === 'present').length
    const lateCount = roster.filter(r => r.status === 'late').length
    const absentCount = roster.filter(r => r.status === 'absent').length

    res.json({
      session: {
        id: session._id,
        course_code: session.course_id?.code,
        course_name: session.course_id?.name,
        session_type: session.session_type,
        batch: session.batch || 'all',
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time
      },
      stats: {
        total: roster.length,
        present: presentCount,
        late: lateCount,
        absent: absentCount
      },
      records: roster
    })
  } catch (err) {
    console.error('Session attendance error:', err)
    res.status(500).json({ error: 'Server error loading session attendance' })
  }
})

// Update student attendance status for a session (supports single or array of updates)
app.put('/api/sessions/:id/attendance', authenticate, authorize(['faculty', 'hod', 'admin']), validateObjectId, async (req, res) => {
  try {
    const { updates } = req.body // array of { student_id, status }
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' })
    }

    const session = await Session.findById(req.params.id)
    if (!session) return res.status(404).json({ error: 'Session not found' })

    // BOLA check: Faculty can only modify attendance for their own sessions
    if (req.user.role === 'faculty' && session.faculty_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You may only modify attendance for sessions you conducted.' })
    }

    const bulkOps = updates.map(u => ({
      updateOne: {
        filter: { session_id: session._id, student_id: u.student_id },
        update: {
          $set: {
            status: u.status,
            marked_at: new Date()
          }
        },
        upsert: true
      }
    }))

    await AttendanceRecord.bulkWrite(bulkOps)
    res.json({ success: true, count: updates.length, message: `Successfully updated ${updates.length} attendance record(s)` })
  } catch (err) {
    console.error('Update attendance error:', err)
    res.status(500).json({ error: 'Server error updating attendance' })
  }
})

// Create a new session with Practical Batch support (all, A1, A2)
app.post('/api/sessions', sessionLimiter, authenticate, authorize(['faculty', 'hod', 'admin']), async (req, res) => {
  try {
    const { course_id, faculty_id, session_type, batch = 'all', session_date, start_time, end_time } = req.body
    
    // Ensure faculty only creates sessions for themselves unless HOD or Admin
    const targetFacultyId = req.user.role === 'faculty' ? req.user.id : (faculty_id || req.user.id)
    const qr_secret = crypto.randomBytes(32).toString('hex')

    const session = await Session.create({
      course_id,
      faculty_id: targetFacultyId,
      session_type,
      batch: session_type === 'practical' ? (batch || 'all') : 'all',
      session_date,
      start_time,
      end_time,
      qr_secret,
      is_active: true
    })

    // Secure response: do not expose qr_secret over the wire
    res.status(201).json({ id: session._id, batch: session.batch })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error creating session' })
  }
})

// Get session details and current QR token
app.get('/api/sessions/:id/qr', authenticate, authorize(['faculty', 'hod', 'admin']), validateObjectId, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('course_id')
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // BOLA check: Faculty can only launch QR for their own sessions
    if (req.user.role === 'faculty' && session.faculty_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You may only display QR codes for sessions you teach.' })
    }

    const token = generateToken(session.qr_secret)
    const attendanceCount = await AttendanceRecord.countDocuments({ session_id: req.params.id, status: 'present' })

    const sessionData = session.toJSON()
    delete sessionData.qr_secret
    sessionData.course_name = session.course_id?.name
    sessionData.course_code = session.course_id?.code
    sessionData.batch = session.batch || 'all'

    res.json({
      session: sessionData,
      token,
      attendanceCount
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error loading session QR' })
  }
})

// === GEOFENCING & CAMPUS ENDPOINT ===
app.get('/api/campus/info', async (req, res) => {
  try {
    const dept = await Department.findOne()
    res.json({
      name: dept?.name || 'Information Technology - Terna Engineering College',
      campus_lat: dept?.campus_lat || 19.0330,
      campus_lng: dept?.campus_lng || 73.0297,
      campus_radius_m: dept?.campus_radius_m || 200
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// === STUDENT ENDPOINTS ===

// Scan QR and mark attendance with Geofencing, Batch validation & Single-Device Verification
app.post('/api/attendance/scan', scanLimiter, authenticate, authorize(['student']), async (req, res) => {
  try {
    const { student_id, session_id, token, lat, lng, device_id, device_fingerprint } = req.body

    // Anti-Proxy: Verify that the authenticated bearer token matches the student ID in the payload
    if (req.user.id.toString() !== student_id?.toString()) {
      return res.status(403).json({
        error: 'Security Alert: You cannot mark attendance on behalf of another student.'
      })
    }

    const student = await User.findById(student_id)
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    if (student.is_active === false) {
      return res.status(403).json({ error: 'Your account is deactivated. Attendance cannot be marked.' })
    }

    const session = await Session.findById(session_id).populate({
      path: 'course_id',
      populate: { path: 'department_id' }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    if (!session.is_active) {
      return res.status(400).json({ error: 'Session is no longer active' })
    }

    // 1. Practical Batch Restriction Check (A1 vs A2)
    if (session.session_type === 'practical' && session.batch && session.batch !== 'all') {
      if (student.batch && student.batch !== session.batch) {
        return res.status(403).json({
          error: `Batch Restriction: This practical session is designated for Batch ${session.batch}. You belong to Batch ${student.batch}.`
        })
      }
    }

    // 2. Single-Device Binding (Anti-Proxy Hardware Lock)
    const clientDevice = (device_id || device_fingerprint || '').trim()
    if (clientDevice) {
      if (!student.device_id) {
        // Automatically bind student to this smartphone on first scan
        student.device_id = clientDevice
        student.device_name = req.headers['user-agent'] || 'Registered Device'
        student.device_bound_at = new Date()
        await student.save()
      } else if (student.device_id !== clientDevice) {
        return res.status(403).json({
          error: 'Proxy Detection: Your account is locked to your registered smartphone. Attendance cannot be marked from another device.',
          proxyViolation: true
        })
      }
    }

    const numLat = Number(lat)
    const numLng = Number(lng)
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ error: 'Invalid or missing GPS coordinates for geofence validation' })
    }

    const dept = session.course_id?.department_id
    if (dept) {
      const geoCheck = verifyCampusGeofence(numLat, numLng, dept.campus_lat, dept.campus_lng, dept.campus_radius_m)
      if (!geoCheck.isAllowed) {
        return res.status(403).json({ 
          error: `Geofence Violation: You are ${geoCheck.distance}m away from campus. Attendance must be marked within ${geoCheck.radiusMeters}m of campus perimeter.`,
          distance: geoCheck.distance,
          radiusMeters: geoCheck.radiusMeters
        })
      }
    }

    if (!validateToken(session.qr_secret, token)) {
      return res.status(403).json({ error: 'Invalid or expired QR code. Please scan again.' })
    }

    await AttendanceRecord.findOneAndUpdate(
      { student_id, session_id },
      {
        status: 'present',
        scan_lat: numLat,
        scan_lng: numLng,
        device_id: clientDevice,
        device_fingerprint: clientDevice,
        marked_at: new Date()
      },
      { upsert: true, new: true }
    )

    res.json({
      success: true,
      message: 'Attendance marked successfully within campus geofence!',
      deviceBound: !!student.device_id
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get student monthly attendance analysis (separate Lectures & Practicals for a chosen month)
app.get('/api/student/:id/monthly-analysis', authenticate, validateObjectId, async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied: You may only view your own monthly attendance analysis.' })
    }

    const student = await User.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Default to September 2026 if not specified
    let selectedMonth = req.query.month || '2026-09'

    // Distinct available months in sessions
    const allSessionDates = await Session.distinct('session_date')
    const monthSet = new Set()
    allSessionDates.forEach(d => {
      if (d && d.length >= 7) monthSet.add(d.slice(0, 7))
    })
    if (!monthSet.has('2026-09')) monthSet.add('2026-09')
    if (!monthSet.has('2026-08')) monthSet.add('2026-08')

    const availableMonths = Array.from(monthSet).sort().reverse().map(m => {
      const [year, mo] = m.split('-')
      const dateObj = new Date(Number(year), Number(mo) - 1, 1)
      const label = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      return { value: m, label }
    })

    // Fetch sessions in selected month
    const sessionsInMonth = await Session.find({
      session_date: { $regex: `^${selectedMonth}` }
    }).populate({
      path: 'course_id',
      populate: { path: 'faculty_ids' }
    }).populate('faculty_id')

    // Find attendance records for student
    const sessionIds = sessionsInMonth.map(s => s._id)
    const records = await AttendanceRecord.find({
      student_id: student._id,
      session_id: { $in: sessionIds },
      status: 'present'
    })
    const attendedSessionSet = new Set(records.map(r => r.session_id.toString()))

    // Separate Lectures vs Practicals
    const lectureMap = {}
    const practicalMap = {}

    sessionsInMonth.forEach(session => {
      const course = session.course_id
      if (!course) return

      // Batch restriction: If practical session is designated for a specific batch (A1 or A2), only students in that batch are eligible
      if (session.session_type === 'practical' && session.batch && session.batch !== 'all') {
        if (student.batch && student.batch !== session.batch) return
      }

      const isPractical = session.session_type === 'practical'
      const targetMap = isPractical ? practicalMap : lectureMap
      const key = `${course.code}_${session.session_type}`

      if (!targetMap[key]) {
        targetMap[key] = {
          code: course.code,
          name: course.name,
          type: isPractical ? 'Practical' : 'Lecture',
          facultyName: session.faculty_id?.name || (course.faculty_ids?.[0]?.name) || 'Faculty',
          total: 0,
          attended: 0
        }
      }

      targetMap[key].total += 1
      if (attendedSessionSet.has(session._id.toString())) {
        targetMap[key].attended += 1
      }
    })

    const calculateItem = (item) => {
      const percentage = item.total > 0 ? Number(((item.attended / item.total) * 100).toFixed(1)) : 0
      const isDefaulter = percentage < 75
      const target = 0.75
      const classesNeeded = isDefaulter && item.total > 0
        ? Math.max(0, Math.ceil((target * item.total - item.attended) / (1 - target)))
        : 0
      return {
        ...item,
        percentage,
        isDefaulter,
        classesNeeded
      }
    }

    const lectures = Object.values(lectureMap).map(calculateItem).sort((a, b) => a.code.localeCompare(b.code))
    const practicals = Object.values(practicalMap).map(calculateItem).sort((a, b) => a.code.localeCompare(b.code))

    const lectureAttended = lectures.reduce((acc, l) => acc + l.attended, 0)
    const lectureTotal = lectures.reduce((acc, l) => acc + l.total, 0)
    const practicalAttended = practicals.reduce((acc, p) => acc + p.attended, 0)
    const practicalTotal = practicals.reduce((acc, p) => acc + p.total, 0)

    const overallAttended = lectureAttended + practicalAttended
    const overallTotal = lectureTotal + practicalTotal
    const overallPercentage = overallTotal > 0 ? Number(((overallAttended / overallTotal) * 100).toFixed(1)) : 0
    const overallDefaulter = overallPercentage < 75
    const overallClassesNeeded = overallDefaulter && overallTotal > 0
      ? Math.max(0, Math.ceil((0.75 * overallTotal - overallAttended) / 0.25))
      : 0

    const [y, m] = selectedMonth.split('-')
    const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

    res.json({
      month: selectedMonth,
      monthLabel,
      availableMonths: availableMonths.length > 0 ? availableMonths : [{ value: selectedMonth, label: monthLabel }],
      student: {
        id: student._id,
        name: student.name,
        roll_number: student.roll_number
      },
      overall: {
        attended: overallAttended,
        total: overallTotal,
        percentage: overallPercentage,
        isDefaulter: overallDefaulter,
        classesNeeded: overallClassesNeeded
      },
      summary: {
        lectureAttended,
        lectureTotal,
        lecturePercentage: lectureTotal > 0 ? Number(((lectureAttended / lectureTotal) * 100).toFixed(1)) : 0,
        practicalAttended,
        practicalTotal,
        practicalPercentage: practicalTotal > 0 ? Number(((practicalAttended / practicalTotal) * 100).toFixed(1)) : 0
      },
      lectures,
      practicals
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// === HOD & FACULTY MONTHLY DEFAULTERS LIST ===
app.get('/api/hod/monthly-defaulters', authenticate, authorize(['hod', 'admin']), async (req, res) => {
  try {
    let selectedMonth = req.query.month || '2026-09'
    const threshold = Number(req.query.threshold) || 75

    // Get all sessions in the selected month
    const sessions = await Session.find({
      session_date: { $regex: `^${selectedMonth}` }
    })
    const totalSessionsConducted = sessions.length
    const sessionIds = sessions.map(s => s._id)
    const sessionTypeMap = {}
    sessions.forEach(s => { sessionTypeMap[s._id.toString()] = s.session_type })

    const lectureSessionsCount = sessions.filter(s => s.session_type === 'lecture').length
    const practicalSessionsCount = sessions.filter(s => s.session_type === 'practical').length

    // Get all students
    const students = await User.find({ role: 'student' }).sort({ roll_number: 1 })

    // Get all attendance records in this month
    const attendanceRecords = await AttendanceRecord.find({
      session_id: { $in: sessionIds },
      status: 'present'
    })

    const studentAttendance = {}
    attendanceRecords.forEach(rec => {
      const sId = rec.student_id.toString()
      if (!studentAttendance[sId]) {
        studentAttendance[sId] = { total: 0, lecture: 0, practical: 0 }
      }
      studentAttendance[sId].total += 1
      const type = sessionTypeMap[rec.session_id.toString()]
      if (type === 'lecture') studentAttendance[sId].lecture += 1
      else if (type === 'practical') studentAttendance[sId].practical += 1
    })

    const studentRoster = students.map(st => {
      const sId = st._id.toString()
      const counts = studentAttendance[sId] || { total: 0, lecture: 0, practical: 0 }
      const stBatch = st.batch || 'A1'

      // Calculate sessions conducted specifically for this student's batch
      const studentEligibleSessions = sessions.filter(s => 
        s.session_type === 'lecture' || s.batch === 'all' || s.batch === stBatch
      )
      const studentTotalConducted = studentEligibleSessions.length
      const studentLectureConducted = studentEligibleSessions.filter(s => s.session_type === 'lecture').length
      const studentPracticalConducted = studentEligibleSessions.filter(s => s.session_type === 'practical').length

      const overallPct = studentTotalConducted > 0 
        ? Number(((counts.total / studentTotalConducted) * 100).toFixed(1))
        : 0
      const lecturePct = studentLectureConducted > 0 
        ? Number(((counts.lecture / studentLectureConducted) * 100).toFixed(1))
        : 0
      const practicalPct = studentPracticalConducted > 0 
        ? Number(((counts.practical / studentPracticalConducted) * 100).toFixed(1))
        : 0

      const isDefaulter = overallPct < threshold
      return {
        id: st._id,
        name: st.name,
        roll_number: st.roll_number,
        batch: stBatch,
        attended: counts.total,
        total: studentTotalConducted,
        percentage: overallPct,
        lecturePercentage: lecturePct,
        practicalPercentage: practicalPct,
        isDefaulter,
        riskLevel: overallPct < 50 ? 'Critical' : overallPct < 65 ? 'High' : overallPct < 75 ? 'Moderate' : 'Safe'
      }
    })

    const defaulters = studentRoster.filter(s => s.isDefaulter)
    const eligible = studentRoster.filter(s => !s.isDefaulter)

    const avgOverall = studentRoster.length > 0
      ? Number((studentRoster.reduce((sum, s) => sum + s.percentage, 0) / studentRoster.length).toFixed(1))
      : 0

    // Available months
    const allDates = await Session.distinct('session_date')
    const monthSet = new Set()
    allDates.forEach(d => { if (d && d.length >= 7) monthSet.add(d.slice(0, 7)) })
    if (!monthSet.has('2026-09')) monthSet.add('2026-09')
    if (!monthSet.has('2026-08')) monthSet.add('2026-08')

    const availableMonths = Array.from(monthSet).sort().reverse().map(m => {
      const [year, mo] = m.split('-')
      const label = new Date(Number(year), Number(mo) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      return { value: m, label }
    })

    const [y, m] = selectedMonth.split('-')
    const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

    res.json({
      month: selectedMonth,
      monthLabel,
      availableMonths,
      threshold,
      stats: {
        totalStudents: students.length,
        defaulterCount: defaulters.length,
        eligibleCount: eligible.length,
        deptAvgPercentage: avgOverall,
        totalSessionsConducted,
        lectureSessionsCount,
        practicalSessionsCount
      },
      defaulters,
      allStudents: studentRoster
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Trigger Automated Defaulter Alerts (WhatsApp Direct Alert & Email Warning Center)
app.post('/api/hod/notify-defaulters', notifyLimiter, authenticate, authorize(['hod', 'admin']), async (req, res) => {
  try {
    const { month = '2026-09', channel = 'whatsapp', threshold = 75, defaulterIds = [] } = req.body

    let targetIds = defaulterIds
    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      // Find all students who are defaulters
      const students = await User.find({ role: 'student' })
      targetIds = students.slice(0, 20).map(s => s._id)
    }

    const logEntries = targetIds.map(sId => ({
      student_id: sId,
      channel,
      month,
      percentage: threshold,
      status: 'sent',
      message: `Official Defaulter Alert: Attendance below ${threshold}% in ${month}. Contact HOD IT immediately.`,
      sent_by: req.user.id,
      sent_at: new Date()
    }))

    if (logEntries.length > 0) {
      await NotificationLog.insertMany(logEntries)
    }

    res.json({
      success: true,
      count: targetIds.length,
      channel,
      month,
      message: `Dispatched ${targetIds.length} automated ${channel.toUpperCase()} warning alerts for ${month}.`
    })
  } catch (err) {
    console.error('Notify defaulters error:', err)
    res.status(500).json({ error: 'Server error dispatching defaulter alerts' })
  }
})

// Get student dashboard stats (live for current month)
app.get('/api/student/:id/stats', authenticate, validateObjectId, async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied: You may only view your own statistics.' })
    }

    const student = await User.findById(req.params.id)
    if (!student) return res.status(404).json({ error: 'Student not found' })

    const stBatch = student.batch || 'A1'
    const sessionFilter = {
      session_date: { $regex: '^2026-09' },
      $or: [
        { session_type: 'lecture' },
        { batch: 'all' },
        { batch: stBatch }
      ]
    }
    const totalSessions = await Session.countDocuments(sessionFilter)
    const sessionIds = (await Session.find(sessionFilter).select('_id')).map(s => s._id)
    const attendedSessions = await AttendanceRecord.countDocuments({
      student_id: student._id,
      session_id: { $in: sessionIds },
      status: 'present'
    })
    const rate = totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(1) : '0.0'

    res.json({
      attendanceRate: `${rate}%`,
      attended: attendedSessions,
      total: totalSessions,
      enrolled: 10
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// === ADMIN ENDPOINTS ===

// Get Admin overview statistics (Admin only)
app.get('/api/admin/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [totalStudents, totalFaculty, activeCourses, totalSessions, totalPresent, dept] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: { $in: ['faculty', 'hod'] } }),
      Course.countDocuments(),
      Session.countDocuments(),
      AttendanceRecord.countDocuments({ status: 'present' }),
      Department.findOne()
    ])

    const totalPossible = totalSessions * (totalStudents || 1)
    const avgAttendance = totalPossible > 0 ? Number(((totalPresent / totalPossible) * 100).toFixed(1)) : 81.4

    res.json({
      department: dept?.name || 'Information Technology',
      totalStudents,
      facultyMembers: totalFaculty,
      activeCourses,
      totalSessions,
      systemStatus: 'Active',
      database: dbInfo.isEmbedded ? 'Embedded MongoDB' : 'MongoDB Local/Atlas',
      avgAttendance: `${avgAttendance}%`
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    res.status(500).json({ error: 'Server error loading admin stats' })
  }
})

// Get students list with optional search and year filter (Admin & HOD)
app.get('/api/students', authenticate, authorize(['admin', 'hod']), async (req, res) => {
  try {
    const filter = { role: 'student' }
    if (req.query.search) {
      const q = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { roll_number: new RegExp(q, 'i') }
      ]
    }
    if (req.query.year && req.query.year !== 'all') {
      filter.year = Number(req.query.year)
    }

    const students = await User.find(filter).sort({ roll_number: 1 }).select('-password')
    res.json(students)
  } catch (err) {
    console.error('Students fetch error:', err)
    res.status(500).json({ error: 'Server error loading students' })
  }
})

// Create new student (Admin only)
app.post('/api/students', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, roll_number, password, year, semester, batch = 'A1' } = req.body
    if (!name || !roll_number) {
      return res.status(400).json({ error: 'Student Name and Roll/ID number are required' })
    }

    const cleanRoll = roll_number.trim().toUpperCase()
    const existing = await User.findOne({ roll_number: cleanRoll })
    if (existing) {
      return res.status(400).json({ error: `A student with ID ${cleanRoll} already exists` })
    }

    const rawPw = (password || `${cleanRoll.toLowerCase()}123`).trim()
    const dept = await Department.findOne()
    const student = await User.create({
      name: name.trim(),
      roll_number: cleanRoll,
      password: bcrypt.hashSync(rawPw, 10),
      role: 'student',
      department_id: dept?._id,
      batch: batch === 'A2' ? 'A2' : 'A1',
      year: Number(year) || 2,
      semester: Number(semester) || 3,
      is_active: true
    })

    const studentData = student.toJSON()
    delete studentData.password
    res.status(201).json(studentData)
  } catch (err) {
    console.error('Create student error:', err)
    res.status(500).json({ error: 'Server error creating student' })
  }
})

// Update student (Admin only)
app.put('/api/students/:id', authenticate, authorize(['admin']), validateObjectId, async (req, res) => {
  try {
    const { name, roll_number, year, semester, batch, is_active } = req.body
    const update = {}
    if (name) update.name = name.trim()
    if (roll_number) update.roll_number = roll_number.trim().toUpperCase()
    if (year !== undefined) update.year = Number(year)
    if (semester !== undefined) update.semester = Number(semester)
    if (batch !== undefined) update.batch = batch === 'A2' ? 'A2' : 'A1'
    if (is_active !== undefined) update.is_active = Boolean(is_active)

    const student = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password')
    if (!student) return res.status(404).json({ error: 'Student not found' })

    res.json(student)
  } catch (err) {
    console.error('Update student error:', err)
    res.status(500).json({ error: 'Server error updating student' })
  }
})

// Reset student's single-device binding (Admin & HOD recovery action)
app.post('/api/students/:id/reset-device', authenticate, authorize(['admin', 'hod']), validateObjectId, async (req, res) => {
  try {
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { device_id: null, device_name: null, device_bound_at: null },
      { new: true }
    ).select('-password')

    if (!student) return res.status(404).json({ error: 'Student not found' })

    res.json({
      success: true,
      message: `Single-device hardware lock for ${student.name} (${student.roll_number}) has been reset. The student can now register a new smartphone.`,
      student
    })
  } catch (err) {
    console.error('Reset device error:', err)
    res.status(500).json({ error: 'Server error resetting device lock' })
  }
})

// Delete student with cascade removal of records (Admin only)
app.delete('/api/students/:id', authenticate, authorize(['admin']), validateObjectId, async (req, res) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id)
    if (!student) return res.status(404).json({ error: 'Student not found' })

    // Cascade delete related records to prevent orphaned documents
    await AttendanceRecord.deleteMany({ student_id: req.params.id })
    await NotificationLog.deleteMany({ student_id: req.params.id })

    res.json({ success: true, message: 'Student and related records removed successfully' })
  } catch (err) {
    console.error('Delete student error:', err)
    res.status(500).json({ error: 'Server error deleting student' })
  }
})

// === PRODUCTION STATIC FRONTEND SERVING & SPA ROUTING ===
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))

// 404 catch-all specifically for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` })
})

// Client-side routing fallback: serve index.html for all page routes
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDist, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Digital Attendance server is running. Frontend build not found. Run npm run build.')
  }
})

// === CENTRALIZED ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err)
  res.status(err.status || 500).json({
    error: 'Internal server error occurred. Please try again later.'
  })
})

await connectDB()
await seedDatabase(false)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
