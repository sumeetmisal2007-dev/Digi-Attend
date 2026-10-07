import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { connectDB } from './db.js'
import { Department, User, Course, Session, AttendanceRecord } from './models.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function seedDatabase(force = false) {
  const hasEDLab = await Course.findOne({ code: 'IT305L' })
  if (!force && hasEDLab) {
    const sessionCount = await Session.countDocuments()
    const facultyCount = await User.countDocuments({ role: { $in: ['faculty', 'hod'] } })
    const courseCount = await Course.countDocuments()
    if (sessionCount >= 50 && facultyCount >= 10 && courseCount >= 12) return
  }

  console.log('Seeding MongoDB database with updated faculty and course assignments...')

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
    { name: 'Dakshata Argade', roll_number: 'TUTF2526001', password: hashPw('Tut@f2526001'), role: 'faculty', department_id: dept._id },
    { name: 'Sejal Jadhav', roll_number: 'TUTF2526002', password: hashPw('Tut@f2526002'), role: 'faculty', department_id: dept._id },
    { name: 'Preeti Patil', roll_number: 'TUTF2526003', password: hashPw('Tut@f2526003'), role: 'faculty', department_id: dept._id },
    { name: 'Smita Deshmukh', roll_number: 'TUTF2526004', password: hashPw('Tut@f2526004'), role: 'faculty', department_id: dept._id },
    { name: 'Suman Sharma', roll_number: 'TUTF2526005', password: hashPw('Tut@f2526005'), role: 'faculty', department_id: dept._id },
    { name: 'Rekha Rathore', roll_number: 'TUTF2526006', password: hashPw('Tut@f2526006'), role: 'faculty', department_id: dept._id },
    { name: 'Sayli Jadhav More', roll_number: 'TUTF2526007', password: hashPw('Tut@f2526007'), role: 'faculty', department_id: dept._id },
    { name: 'Dr. Supriya Babar', roll_number: 'TUTF2526008', password: hashPw('Tut@f2526008'), role: 'faculty', department_id: dept._id },
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
      name: 'Network Design Practical (Class Advisor)',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [sejal._id]
    },
    {
      code: 'IT302',
      name: 'Operating System (OS)',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [dakshata._id]
    },
    {
      code: 'IT302L',
      name: 'Linux Lab (OS Practical)',
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
      code: 'IT303L',
      name: 'SQL Lab (DBMS Practical)',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [smita._id]
    },
    {
      code: 'IT304',
      name: 'Applied Statistical Learning (ASL)',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [rekha._id]
    },
    {
      code: 'IT304L',
      name: 'ASL Lab (Applied Statistical Learning Practical)',
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
      code: 'IT305L',
      name: 'ED Lab (Entrepreneurship Development Practical)',
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
      code: 'IT306L',
      name: 'ES Lab (Engineering for Sustainability Practical)',
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
      name: 'Nirmaan Lab',
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
    // Theory Lectures
    { courseCode: 'IT301', type: 'lecture', facultyId: hod._id, startTime: '09:00', endTime: '10:00' },
    { courseCode: 'IT302', type: 'lecture', facultyId: dakshata._id, startTime: '10:00', endTime: '11:00' },
    { courseCode: 'IT303', type: 'lecture', facultyId: smita._id, startTime: '11:15', endTime: '12:15' },
    { courseCode: 'IT304', type: 'lecture', facultyId: rekha._id, startTime: '12:15', endTime: '13:15' },
    { courseCode: 'IT305', type: 'lecture', facultyId: preeti._id, startTime: '14:00', endTime: '15:00' },
    { courseCode: 'IT306', type: 'lecture', facultyId: subriya._id, startTime: '15:00', endTime: '16:00' },
    { courseCode: 'IT307', type: 'lecture', facultyId: suman._id, startTime: '16:00', endTime: '17:00' },

    // Practical Labs (with Batch A1 and A2 Divisions)
    { courseCode: 'IT301L', type: 'practical', batch: 'A1', facultyId: sejal._id, startTime: '09:00', endTime: '11:00' },
    { courseCode: 'IT301L', type: 'practical', batch: 'A2', facultyId: sejal._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT302L', type: 'practical', batch: 'A1', facultyId: dakshata._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT302L', type: 'practical', batch: 'A2', facultyId: dakshata._id, startTime: '14:00', endTime: '16:00' },
    { courseCode: 'IT303L', type: 'practical', batch: 'A1', facultyId: smita._id, startTime: '14:00', endTime: '16:00' },
    { courseCode: 'IT303L', type: 'practical', batch: 'A2', facultyId: smita._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT304L', type: 'practical', batch: 'A1', facultyId: sayali._id, startTime: '09:00', endTime: '11:00' },
    { courseCode: 'IT304L', type: 'practical', batch: 'A2', facultyId: sayali._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT305L', type: 'practical', batch: 'A1', facultyId: preeti._id, startTime: '11:15', endTime: '13:15' },
    { courseCode: 'IT305L', type: 'practical', batch: 'A2', facultyId: preeti._id, startTime: '14:00', endTime: '16:00' },
    { courseCode: 'IT306L', type: 'practical', batch: 'A1', facultyId: subriya._id, startTime: '14:00', endTime: '16:00' },
    { courseCode: 'IT306L', type: 'practical', batch: 'A2', facultyId: subriya._id, startTime: '11:15', endTime: '13:15' },
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

  // Specific target students for integrated attendance
  const targetRollNumbers = new Set(['TU4F2526030', 'TU4F2526035', 'TU4F2526039'])
  const targetNames = [
    'KAMBLE SANCHI MAROTI',
    'CHOUDHARI SIDDHESH DATTATRAY',
    'MISAL SUMEET RAMESH'
  ]

  const isTargetStudent = (student) => {
    if (targetRollNumbers.has(student.roll_number?.trim().toUpperCase())) return true
    const norm = (student.name || '').trim().toUpperCase()
    return targetNames.some(t => norm.includes(t) || t.includes(norm))
  }

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

        // Integrate attendance for the three students (Kamble Sanchi Maroti, Choudhari Siddhesh Dattatray, Misal Sumeet Ramesh)
        // Attendance for all other students is strictly nil (no attendance records created).
        // Zero random input used (deterministic campus coordinates and device signatures).
        allCreatedStudents.forEach((student) => {
          if (!isTargetStudent(student)) return

          // If practical session is for a specific batch (A1 or A2), only students in that batch are eligible
          if (tpl.type === 'practical' && tpl.batch && tpl.batch !== 'all') {
            if (student.batch !== tpl.batch) return
          }

          attendanceRecordsToInsert.push({
            student_id: student._id,
            session_id: session._id,
            status: 'present',
            scan_lat: dept.campus_lat,
            scan_lng: dept.campus_lng,
            device_fingerprint: `fp_${student.roll_number.toLowerCase()}`,
            marked_at: new Date(`${date}T${tpl.startTime}:00Z`)
          })
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
