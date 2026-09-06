-- ========== ENUMS ==========
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'hod', 'admin');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE session_type AS ENUM ('lecture', 'practical');

-- ========== TABLES ==========

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) UNIQUE NOT NULL,
  campus_lat DECIMAL(10, 7) NOT NULL,
  campus_lng DECIMAL(10, 7) NOT NULL,
  campus_radius_m INTEGER DEFAULT 200
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  roll_number VARCHAR(30) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  year INTEGER,
  semester INTEGER,
  device_fingerprint VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty_courses (
  faculty_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  PRIMARY KEY (faculty_id, course_id)
);

CREATE TABLE IF NOT EXISTS student_courses (
  student_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  PRIMARY KEY (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  faculty_id INTEGER NOT NULL REFERENCES users(id),
  session_type session_type NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  qr_secret VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  status attendance_status NOT NULL DEFAULT 'present',
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  marked_by INTEGER REFERENCES users(id),
  scan_lat DECIMAL(10, 7),
  scan_lng DECIMAL(10, 7),
  device_fingerprint VARCHAR(255),
  UNIQUE (student_id, session_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
