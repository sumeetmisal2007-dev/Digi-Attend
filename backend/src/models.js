import mongoose from 'mongoose'

const schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString()
      delete ret.__v
      return ret
    }
  }
}

export const Department = mongoose.model('Department', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  campus_lat: { type: Number, required: true, default: 19.0298 },
  campus_lng: { type: Number, required: true, default: 73.0166 },
  campus_radius_m: { type: Number, default: 500 }
}, schemaOptions))

export const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  roll_number: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'hod', 'admin'], required: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  batch: { type: String, enum: ['A1', 'A2', 'none'], default: 'A1' },
  year: Number,
  semester: Number,
  device_id: { type: String, default: null },
  device_name: String,
  device_bound_at: Date,
  is_active: { type: Boolean, default: true }
}, schemaOptions))

export const Course = mongoose.model('Course', new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  faculty_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, schemaOptions))

export const Session = mongoose.model('Session', new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session_type: { type: String, enum: ['lecture', 'practical'], required: true },
  batch: { type: String, enum: ['all', 'A1', 'A2'], default: 'all' },
  session_date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  qr_secret: { type: String, required: true },
  is_active: { type: Boolean, default: true }
}, schemaOptions))

export const AttendanceRecord = mongoose.model('AttendanceRecord', new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  scan_lat: Number,
  scan_lng: Number,
  device_id: String,
  device_fingerprint: String,
  marked_at: { type: Date, default: Date.now }
}, schemaOptions))

AttendanceRecord.schema.index({ student_id: 1, session_id: 1 }, { unique: true })
AttendanceRecord.schema.index({ session_id: 1 })
Session.schema.index({ session_date: 1 })
Session.schema.index({ faculty_id: 1 })
Session.schema.index({ course_id: 1 })

export const NotificationLog = mongoose.model('NotificationLog', new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, enum: ['whatsapp', 'email'], required: true },
  month: { type: String, required: true },
  percentage: Number,
  status: { type: String, default: 'sent' },
  message: String,
  sent_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sent_at: { type: Date, default: Date.now }
}, schemaOptions))
