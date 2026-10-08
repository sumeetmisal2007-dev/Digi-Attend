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
    const sumeet = await User.findOne({ roll_number: 'TU4F2526039' })
    if (sumeet) {
      const sumeetPresentCount = await AttendanceRecord.countDocuments({ student_id: sumeet._id, status: 'present' })
      if (sumeetPresentCount === 124) return
    }
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
    campus_lat: 19.0298,
    campus_lng: 73.0166,
    campus_radius_m: 500
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

  const studentPresentCounts = {
    'TU4F2526035': {
      'PCC304': 13,
      'PCT301': 7,
      'PCC301': 9,
      'PCC302': 17,
      'IT306': 9,
      'IT306L': 14,
      '2993511': 13,
      'PCL302': 3,
      'CEP301': 0,
      'OEC301': 4,
      'IT303L': 3,
      'ITC303': 16,
      'PCL304': 10
    },
    'TU4F2526039': {
      'PCC304': 14,
      'PCT301': 8,
      'PCC301': 9,
      'PCC302': 19,
      'IT306': 10,
      'IT306L': 15,
      '2993511': 13,
      'PCL302': 3,
      'CEP301': 0,
      'OEC301': 4,
      'IT303L': 2,
      'ITC303': 19,
      'PCL304': 8
    },
    'TU4F2526030': {
      'PCC304': 14,
      'PCT301': 6,
      'PCC301': 9,
      'PCC302': 17,
      'IT306': 10,
      'IT306L': 15,
      '2993511': 14,
      'PCL302': 3,
      'CEP301': 1,
      'OEC301': 5,
      'IT303L': 2,
      'ITC303': 16,
      'PCL304': 9
    }
  }

  const getStudentPresentTarget = (student, courseCode) => {
    const roll = (student.roll_number || '').trim().toUpperCase()
    if (studentPresentCounts[roll] && studentPresentCounts[roll][courseCode] !== undefined) {
      return studentPresentCounts[roll][courseCode]
    }
    const norm = (student.name || '').trim().toUpperCase()
    if (norm.includes('CHOUDHARI') || norm.includes('SIDDHESH')) {
      return studentPresentCounts['TU4F2526035']?.[courseCode]
    }
    if (norm.includes('MISAL') || norm.includes('SUMEET')) {
      return studentPresentCounts['TU4F2526039']?.[courseCode]
    }
    if (norm.includes('KAMBLE') || norm.includes('SANCHI')) {
      return studentPresentCounts['TU4F2526030']?.[courseCode]
    }
    return null
  }

  for (const config of realSubjectConfigs) {
    const course = courseMap[config.code]
    if (!course) continue

    for (let sIdx = 0; sIdx < config.totalSessions; sIdx++) {
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

      allCreatedStudents.forEach((student) => {
        const presentTarget = getStudentPresentTarget(student, config.code)

        if (presentTarget !== null && presentTarget !== undefined) {
          const isPresent = sIdx < presentTarget
          attendanceRecordsToInsert.push({
            student_id: student._id,
            session_id: session._id,
            status: isPresent ? 'present' : 'absent',
            scan_lat: dept.campus_lat,
            scan_lng: dept.campus_lng,
            device_fingerprint: `fp_${student.roll_number.toLowerCase()}`,
            marked_at: new Date(`${dateStr}T${config.startTime}:00Z`)
          })
        } else {
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await connectDB()
  await seedDatabase(true)
  process.exit(0)
}
