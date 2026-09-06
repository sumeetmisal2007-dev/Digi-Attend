CREATE TYPE user_role AS ENUM ('student', 'faculty', 'hod');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  role user_role NOT NULL,
  department VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  faculty_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL,
  marked_by INTEGER REFERENCES users(id),
  UNIQUE (student_id, course_id, attendance_date)
);

INSERT INTO users (name, email, role, department) VALUES
  ('Aarav Mehta', 'aarav@campus.edu', 'student', 'Computer Science'),
  ('Dr. Nisha Rao', 'nisha.rao@campus.edu', 'faculty', 'Computer Science'),
  ('Prof. Vikram Shah', 'vikram.shah@campus.edu', 'hod', 'Computer Science')
ON CONFLICT (email) DO NOTHING;

INSERT INTO courses (code, name, semester, faculty_id)
SELECT 'CS301', 'Database Systems', 'Semester 5', id FROM users WHERE email = 'nisha.rao@campus.edu'
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, semester, faculty_id)
SELECT 'CS302', 'Operating Systems', 'Semester 5', id FROM users WHERE email = 'nisha.rao@campus.edu'
ON CONFLICT (code) DO NOTHING;
