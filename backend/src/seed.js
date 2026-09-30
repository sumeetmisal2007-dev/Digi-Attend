import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { connectDB } from './db.js'
import { Department, User, Course, Session, AttendanceRecord } from './models.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function seedDatabase(force = false) {
  if (!force) {
    const sessionCount = await Session.countDocuments()
    const facultyCount = await User.countDocuments({ role: { $in: ['faculty', 'hod'] } })
    const courseCount = await Course.countDocuments()
    if (sessionCount >= 50 && facultyCount >= 10 && courseCount >= 10) return
  }

  console.log('Seeding MongoDB database...')

  await Promise.all([
    Department.deleteMany({}),
    User.deleteMany({}),
    Course.deleteMany({}),
    Session.deleteMany({}),
    AttendanceRecord.deleteMany({})
  ])

  const dept = await Department.create({
    name: 'Information Technology',
    campus_lat: 19.0330,
    campus_lng: 73.0297,
    campus_radius_m: 200
  })

  const hashPw = (p) => bcrypt.hashSync(p, 10)

  const users = await User.create([
    { name: 'Dr. Sujata Kadu', roll_number: 'TU0F2526001', password: hashPw('Tu0@f2526001'), role: 'hod', department_id: dept._id },
    { name: 'Add 1', roll_number: 'TUADF2526001', password: hashPw('Tuad@f2526001'), role: 'admin', department_id: dept._id },
    { name: 'Dakshata Shinde', roll_number: 'TUTF2526001', password: hashPw('Tut@f2526001'), role: 'faculty', department_id: dept._id },
    { name: 'Sejal Jadhav', roll_number: 'TUTF2526002', password: hashPw('Tut@f2526002'), role: 'faculty', department_id: dept._id },
    { name: 'Preeti Patil', roll_number: 'TUTF2526003', password: hashPw('Tut@f2526003'), role: 'faculty', department_id: dept._id },
    { name: 'Smita Deshmukh', roll_number: 'TUTF2526004', password: hashPw('Tut@f2526004'), role: 'faculty', department_id: dept._id },
    { name: 'Suman Sharma', roll_number: 'TUTF2526005', password: hashPw('Tut@f2526005'), role: 'faculty', department_id: dept._id },
    { name: 'Rekha Rathore', roll_number: 'TUTF2526006', password: hashPw('Tut@f2526006'), role: 'faculty', department_id: dept._id },
    { name: 'Sayali More', roll_number: 'TUTF2526007', password: hashPw('Tut@f2526007'), role: 'faculty', department_id: dept._id },
    { name: 'Dr. Subriya Babar', roll_number: 'TUTF2526008', password: hashPw('Tut@f2526008'), role: 'faculty', department_id: dept._id },
    { name: 'Vaishali Khairnar', roll_number: 'TUTF2526009', password: hashPw('Tut@f2526009'), role: 'faculty', department_id: dept._id }
  ])

  const [
    hod,
    admin,
    dakshata,
    sejal,
    preeti,
    smita,
    suman,
    rekha,
    sayali,
    subriya,
    vaishali
  ] = users

  // Seed students from student_db.csv if available
  const csvPath = path.resolve(__dirname, '../../student_db.csv')
  const students = []
  if (fs.existsSync(csvPath)) {
    const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n')
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const match = line.match(/^([^,]+),([^,]+),"([^"]+)",([^,]+)$/) || line.split(',')
      const [roll_no, id_no, name, password] = match.length === 5 
        ? [match[1], match[2], match[3], match[4]] 
        : [match[0], match[1], match[2], match[3]]
      
      // Batch A1: Roll no. 1-36, Batch A2: Roll no. 37-80
      const assignedBatch = i <= 36 ? 'A1' : 'A2'

      students.push({
        name: (name || '').replace(/"/g, '').trim(),
        roll_number: (id_no || '').trim(),
        password: hashPw((password || '').trim()),
        role: 'student',
        department_id: dept._id,
        batch: assignedBatch,
        year: 2,
        semester: 3
      })
    }
    if (students.length > 0) {
      await User.insertMany(students)
    }
  }

  await Course.create([
    {
      code: 'IT301',
      name: 'Computer Network and Network Design',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [hod._id]
    },
    {
      code: 'IT301L',
      name: 'Network Design Practical',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [sejal._id]
    },
    {
      code: 'IT302',
      name: 'Operating System',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [dakshata._id]
    },
    {
      code: 'IT303',
      name: 'Database Management System (DBMS)',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [smita._id]
    },
    {
      code: 'IT304',
      name: 'Applied Statistical Learning and Artificial Intelligence',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [rekha._id]
    },
    {
      code: 'IT304L',
      name: 'Applied Statistical Learning Practical',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [sayali._id]
    },
    {
      code: 'IT305',
      name: 'Entrepreneurship Development (ED)',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [preeti._id]
    },
    {
      code: 'IT306',
      name: 'Engineering for Sustainability (ES)',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [subriya._id]
    },
    {
      code: 'IT307',
      name: 'Logical Reasoning',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [suman._id]
    },
    {
      code: 'IT308',
      name: 'Nirman Practical',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [vaishali._id]
    }
  ])

  // Map courses by code for session creation
  const courses = await Course.find({ department_id: dept._id })
  const courseMap = {}
  courses.forEach(c => { courseMap[c.code] = c })

  // Define teaching session templates (Lectures and Practicals)
  const sessionTemplates = [
    // 7 Theory Lectures (Separate)
    { courseCode: 'IT301', type: 'lecture', facultyId: hod._id, startTime: '09:00', endTime: '10:00' },
    { courseCode: 'IT302', type: 'lecture', facultyId: dakshata._id, startTime: '10:00', endTime: '11:00' },
    { courseCode: 'IT303', type: 'lecture', facultyId: smita._id, startTime: '11:15', endTime: '12:15' },
    { courseCode: 'IT304', type: 'lecture', facultyId: rekha._id, startTime: '12:15', endTime: '13:15' },
    { courseCode: 'IT305', type: 'lecture', facultyId: preeti._id, startTime: '14:00', endTime: '15:00' },
    { courseCode: 'IT306', type: 'lecture', facultyId: subriya._id, startTime: '15:00', endTime: '16:00' },
    { courseCode: 'IT307', type: 'lecture', facultyId: suman._id, startTime: '16:00', endTime: '17:00' },

    // 7 Practical Labs (with Batch A1 and A2 Divisions)
    { courseCode: 'IT301L', type: 'practical', batch: 'A1', facultyId: sejal._id, startTime: '09:00', endTime: '11:00' },
    { courseCode: 'IT301L', type: 'practical', batch: 'A2', facultyId: sejal._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT302', type: 'practical', batch: 'A1', facultyId: dakshata._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT302', type: 'practical', batch: 'A2', facultyId: dakshata._id, startTime: '14:00', endTime: '16:00' },
    { courseCode: 'IT303', type: 'practical', batch: 'all', facultyId: smita._id, startTime: '14:00', endTime: '16:00' },
    { courseCode: 'IT304L', type: 'practical', batch: 'A1', facultyId: sayali._id, startTime: '09:00', endTime: '11:00' },
    { courseCode: 'IT304L', type: 'practical', batch: 'A2', facultyId: sayali._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT305', type: 'practical', batch: 'all', facultyId: preeti._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT306', type: 'practical', batch: 'all', facultyId: subriya._id, startTime: '14:00', endTime: '16:00' },
    { courseCode: 'IT308', type: 'practical', batch: 'A1', facultyId: vaishali._id, startTime: '10:00', endTime: '12:00' },
    { courseCode: 'IT308', type: 'practical', batch: 'A2', facultyId: vaishali._id, startTime: '12:15', endTime: '14:15' },
  ]

  // Dates for September 2026 and August 2026
  const datesByMonth = {
    '2026-08': ['2026-08-04', '2026-08-07', '2026-08-11', '2026-08-14', '2026-08-18', '2026-08-21', '2026-08-25', '2026-08-28'],
    '2026-09': ['2026-09-01', '2026-09-04', '2026-09-08', '2026-09-11', '2026-09-15', '2026-09-18', '2026-09-22', '2026-09-25']
  }

  const allCreatedStudents = await User.find({ role: 'student', department_id: dept._id })
  const createdSessions = []
  const attendanceRecordsToInsert = []

  for (const [month, dates] of Object.entries(datesByMonth)) {
    for (const date of dates) {
      for (const tpl of sessionTemplates) {
        const course = courseMap[tpl.courseCode]
        if (!course) continue

        // Crypto qr_secret for session
        const qr_secret = `qr_sec_${month}_${tpl.courseCode}_${tpl.type}_${tpl.batch || 'all'}_${date}`
        const session = await Session.create({
          course_id: course._id,
          faculty_id: tpl.facultyId,
          session_type: tpl.type,
          batch: tpl.batch || 'all',
          session_date: date,
          start_time: tpl.startTime,
          end_time: tpl.endTime,
          qr_secret,
          is_active: false
        })
        createdSessions.push(session)

        // Seed attendance for students
        allCreatedStudents.forEach((student, studentIdx) => {
          // If practical session is for a specific batch (A1 or A2), only students in that batch are eligible
          if (tpl.type === 'practical' && tpl.batch && tpl.batch !== 'all') {
            if (student.batch !== tpl.batch) return
          }
          // Specific attendance profiles:
          // Student 0 (TU4F2526001): ~80% attendance (Eligible, > 75%)
          // Student 1 (TU4F2526002): ~60% attendance (Defaulter, < 75%)
          // Student 2 (TU4F2526003): ~90% attendance (Excellent)
          // Student 3 (TU4F2526004): ~52% attendance (Defaulter, < 75%)
          let attendanceProbability = 0.80
          if (studentIdx === 0) attendanceProbability = 0.82
          else if (studentIdx === 1) attendanceProbability = 0.62
          else if (studentIdx === 2) attendanceProbability = 0.94
          else if (studentIdx === 3) attendanceProbability = 0.54
          else {
            // deterministic pseudo-random rate per student based on index
            const rates = [0.88, 0.72, 0.65, 0.91, 0.58, 0.83, 0.76, 0.69, 0.95, 0.61]
            attendanceProbability = rates[studentIdx % rates.length]
          }

          // Deterministic attendance hashing so counts are stable
          const hashVal = ((studentIdx * 37) + (dates.indexOf(date) * 19) + (tpl.courseCode.charCodeAt(2) * 7) + (tpl.type === 'lecture' ? 11 : 23)) % 100
          const isPresent = hashVal < (attendanceProbability * 100)

          if (isPresent) {
            attendanceRecordsToInsert.push({
              student_id: student._id,
              session_id: session._id,
              status: 'present',
              scan_lat: 19.0330 + ((Math.random() - 0.5) * 0.001),
              scan_lng: 73.0297 + ((Math.random() - 0.5) * 0.001),
              device_fingerprint: `fp_${student._id.toString().slice(-4)}`,
              marked_at: new Date(`${date}T${tpl.startTime}:00Z`)
            })
          }
        })
      }
    }
  }

  if (attendanceRecordsToInsert.length > 0) {
    // Insert in batches of 1000
    const chunkSize = 1000
    for (let i = 0; i < attendanceRecordsToInsert.length; i += chunkSize) {
      await AttendanceRecord.insertMany(attendanceRecordsToInsert.slice(i, i + chunkSize))
    }
  }

  console.log(`Seeding complete: 1 dept, ${users.length} staff, ${students.length} students, 10 courses, ${createdSessions.length} sessions, ${attendanceRecordsToInsert.length} attendance records across August & September 2026.`)
}

// Standalone execution: node src/seed.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await connectDB()
  await seedDatabase(true)
  process.exit(0)
}
