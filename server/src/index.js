import express from 'express'
import cors from 'cors'
import { query } from './db.js'

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_request, response) => {
  try {
    await query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    response.status(503).json({ status: 'degraded', database: 'unavailable' })
  }
})

app.get('/api/dashboard', async (request, response) => {
  const role = request.query.role || 'faculty'

  try {
    const [attendance, courses, people] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'present')::int AS present,
          COUNT(*)::int AS total,
          ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 1) AS percentage
        FROM attendance_records
      `),
      query(`
        SELECT c.code, c.name, c.semester,
          COUNT(ar.id)::int AS sessions,
          ROUND(COUNT(ar.id) FILTER (WHERE ar.status = 'present') * 100.0 / NULLIF(COUNT(ar.id), 0), 1) AS attendance
        FROM courses c
        LEFT JOIN attendance_records ar ON ar.course_id = c.id
        GROUP BY c.id
        ORDER BY c.code
        LIMIT 5
      `),
      query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role`)
    ])

    response.json({
      role,
      attendance: attendance.rows[0],
      courses: courses.rows,
      people: people.rows
    })
  } catch (error) {
    response.status(500).json({ message: 'Unable to load dashboard data.' })
  }
})

app.listen(port, () => {
  console.log(`Attendance API listening on http://localhost:${port}`)
})
