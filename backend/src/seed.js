import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { connectDB } from './db.js'
import { Department, User, Course, Session, AttendanceRecord } from './models.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function seedDatabase(force = false) {
  const hasRealERPData = await Course.findOne({ code: 'ITC303' })
  if (!force && hasRealERPData) {
    const sessionCount = await Session.countDocuments()
    if (sessionCount >= 160) return
  }

  console.log('Seeding MongoDB database with real ERP attendance data...')

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

  // Exact real ERP course catalog matching the screenshots (13 subjects)
  await Course.create([
    {
      code: 'ITC303',
      name: 'Database Management System',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [smita._id]
    },
    {
      code: 'PCL304',
      name: 'Linux and Shell Scripting Lab',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [dakshata._id]
    },
    {
      code: 'PCC304',
      name: 'Operating System',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [dakshata._id]
    },
    {
      code: 'IT306L',
      name: 'Engineering for sustainability lab',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [subriya._id]
    },
    {
      code: 'CEP301',
      name: 'Nirman Lab-III',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [vaishali._id]
    },
    {
      code: 'IT303L',
      name: 'SQL Lab',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [smita._id]
    },
    {
      code: '2993511',
      name: 'Entrepreneurship Development',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [preeti._id]
    },
    {
      code: 'OEC301',
      name: 'Open Elective',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [suman._id]
    },
    {
      code: 'PCC301',
      name: 'Applied Statistical Learning & Artificial Intelligence',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [rekha._id]
    },
    {
      code: 'PCC302',
      name: 'Computer Network and Network Design',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [hod._id]
    },
    {
      code: 'PCT301',
      name: 'Applied Statistical Learning & AI Laboratory',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [sayali._id]
    },
    {
      code: 'PCL302',
      name: 'Network Design Lab',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [sejal._id]
    },
    {
      code: 'IT306',
      name: 'Engineering for Sustainability',
      department_id: dept._id,
      year: 2,
      semester: 3,
      faculty_ids: [subriya._id]
    }
  ])

  const courses = await Course.find({ department_id: dept._id })
  const courseMap = {}
  courses.forEach(c => { courseMap[c.code] = c })

  // Real Subject configurations matching Siddhesh ERP screenshots:
  // 1. #ITC303 | Database Management System: 26 Lectures, 16 Present, 10 Absent (Ms. SMITA DESHMUKH)
  // 2. #PCL304 | Linux and Shell Scripting Lab: 10 Practicals, 10 Present, 0 Absent (Ms. DAKSHATA ARGADE)
  // 3. #PCC304 | Operating System: 18 Lectures, 13 Present, 5 Absent (Ms. DAKSHATA ARGADE)
  // 4. #IT306L | Engineering for sustainability lab: 18 Practicals, 14 Present, 4 Absent (Dr. SUPRIYA BABAR)
  // 5. #CEP301 | Nirman Lab-III: 1 Practical, 0 Present, 1 Absent (Dr. VAISHALI KHAIRNAR)
  // 6. #IT303L | SQL Lab: 3 Practicals, 3 Present, 0 Absent (Ms. SMITA DESHMUKH)
  // 7. #2993511 | Entrepreneurship Development: 19 Lectures, 13 Present, 6 Absent (Mrs. PREETI PATIL)
  // 8. #OEC301 | Open Elective: 8 Lectures, 4 Present, 4 Absent (Mrs. SUMAN SARMA)
  // 9. #PCC301 | Applied Statistical Learning & Artificial Intelligence: 11 Lectures, 9 Present, 2 Absent (Mrs. REKHA RATHORE)
  // 10. #PCC302 | Computer Network and Network Design: 20 Lectures, 17 Present, 3 Absent (Dr. SUJATA KADU)
  // 11. #PCT301 | Applied Statistical Learning & AI Laboratory: 9 Practicals, 7 Present, 2 Absent (Miss SAYALI JADHAV)
  // 12. #PCL302 | Network Design Lab: 4 Practicals, 3 Present, 1 Absent (Miss. SEJAL JADHAV)
  // 13. #IT306 | Engineering for Sustainability: 16 Lectures, 9 Present, 7 Absent (Dr. SUPRIYA BABAR)
  const realSubjectConfigs = [
    {
      code: 'ITC303',
      faculty: smita,
      type: 'lecture',
      batch: 'all',
      totalSessions: 26,
      presentSessions: 16,
      startTime: '10:00',
      endTime: '11:00'
    },
    {
      code: 'PCL304',
      faculty: dakshata,
      type: 'practical',
      batch: 'all',
      totalSessions: 10,
      presentSessions: 10,
      startTime: '14:00',
      endTime: '16:00'
    },
    {
      code: 'PCC304',
      faculty: dakshata,
      type: 'lecture',
      batch: 'all',
      totalSessions: 18,
      presentSessions: 13,
      startTime: '10:00',
      endTime: '11:00'
    },
    {
      code: 'IT306L',
      faculty: subriya,
      type: 'practical',
      batch: 'all',
      totalSessions: 18,
      presentSessions: 14,
      startTime: '14:00',
      endTime: '16:00'
    },
    {
      code: 'CEP301',
      faculty: vaishali,
      type: 'practical',
      batch: 'all',
      totalSessions: 1,
      presentSessions: 0,
      startTime: '10:00',
      endTime: '12:00'
    },
    {
      code: 'IT303L',
      faculty: smita,
      type: 'practical',
      batch: 'all',
      totalSessions: 3,
      presentSessions: 3,
      startTime: '11:15',
      endTime: '13:15'
    },
    {
      code: '2993511',
      faculty: preeti,
      type: 'lecture',
      batch: 'all',
      totalSessions: 19,
      presentSessions: 13,
      startTime: '11:15',
      endTime: '12:15'
    },
    {
      code: 'OEC301',
      faculty: suman,
      type: 'lecture',
      batch: 'all',
      totalSessions: 8,
      presentSessions: 4,
      startTime: '14:00',
      endTime: '15:00'
    },
    {
      code: 'PCC301',
      faculty: rekha,
      type: 'lecture',
      batch: 'all',
      totalSessions: 11,
      presentSessions: 9,
      startTime: '12:15',
      endTime: '13:15'
    },
    {
      code: 'PCC302',
      faculty: hod,
      type: 'lecture',
      batch: 'all',
      totalSessions: 20,
      presentSessions: 17,
      startTime: '09:00',
      endTime: '10:00'
    },
    {
      code: 'PCT301',
      faculty: sayali,
      type: 'practical',
      batch: 'all',
      totalSessions: 9,
      presentSessions: 7,
      startTime: '14:00',
      endTime: '16:00'
    },
    {
      code: 'PCL302',
      faculty: sejal,
      type: 'practical',
      batch: 'all',
      totalSessions: 4,
      presentSessions: 3,
      startTime: '14:00',
      endTime: '16:00'
    },
    {
      code: 'IT306',
      faculty: subriya,
      type: 'lecture',
      batch: 'all',
      totalSessions: 16,
      presentSessions: 9,
      startTime: '12:15',
      endTime: '13:15'
    }
  ]

  const allCreatedStudents = await User.find({ role: 'student', department_id: dept._id })
  const createdSessions = []
  const attendanceRecordsToInsert = []

  // The 3 integrated students (Kamble Sanchi Maroti, Choudhari Siddhesh Dattatray, Misal Sumeet Ramesh)
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

  for (const config of realSubjectConfigs) {
    const course = courseMap[config.code]
    if (!course) continue

    for (let sIdx = 0; sIdx < config.totalSessions; sIdx++) {
      // Distribute dates evenly across September 2026 (skipping Sundays)
      const dayNum = 1 + Math.min(27, Math.floor((sIdx * 27) / Math.max(1, config.totalSessions - 1 || 1)))
      const dateStr = `2026-09-${String(dayNum).padStart(2, '0')}`

      const qr_secret = `qr_erp_${config.code}_${sIdx + 1}_${dateStr}`
      const session = await Session.create({
        course_id: course._id,
        faculty_id: config.faculty._id,
        session_type: config.type,
        batch: config.batch,
        session_date: dateStr,
        start_time: config.startTime,
        end_time: config.endTime,
        qr_secret,
        is_active: false
      })
      createdSessions.push(session)

      const isTargetPresent = sIdx < config.presentSessions

      allCreatedStudents.forEach((student) => {
        if (isTargetStudent(student)) {
          attendanceRecordsToInsert.push({
            student_id: student._id,
            session_id: session._id,
            status: isTargetPresent ? 'present' : 'absent',
            scan_lat: dept.campus_lat,
            scan_lng: dept.campus_lng,
            device_fingerprint: `fp_${student.roll_number.toLowerCase()}`,
            marked_at: new Date(`${dateStr}T${config.startTime}:00Z`)
          })
        } else {
          // Attendance for all other students is strictly 0 (all marked absent)
          attendanceRecordsToInsert.push({
            student_id: student._id,
            session_id: session._id,
            status: 'absent',
            scan_lat: null,
            scan_lng: null,
            device_fingerprint: null,
            marked_at: new Date(`${dateStr}T${config.startTime}:00Z`)
          })
        }
      })
    }
  }

  if (attendanceRecordsToInsert.length > 0) {
    const chunkSize = 1000
    for (let i = 0; i < attendanceRecordsToInsert.length; i += chunkSize) {
      await AttendanceRecord.insertMany(attendanceRecordsToInsert.slice(i, i + chunkSize))
    }
  }

  console.log(`Seeding complete: ${createdSessions.length} total ERP sessions created. Integrated students attendance configured accurately from ERP.`)
}

// Standalone execution: node src/seed.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await connectDB()
  await seedDatabase(true)
  process.exit(0)
}
