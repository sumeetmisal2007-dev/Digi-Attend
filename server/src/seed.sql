-- ========== Seed Data for Terna IT Department ==========

-- Department (Terna Engineering College, Nerul, Navi Mumbai)
INSERT INTO departments (name, campus_lat, campus_lng, campus_radius_m)
VALUES ('Information Technology', 19.0330, 73.0297, 200)
ON CONFLICT (name) DO NOTHING;

-- Users: students first (ids 1-5), then faculty (6), hod (7), admin (8)
INSERT INTO users (name, email, role, department_id, roll_number, year, semester) VALUES
  ('Aarav Mehta',       'aarav@campus.edu',          'student', 1, 'TU4F2526035', 2, 3),
  ('Priya Sharma',      'priya@campus.edu',          'student', 1, 'TU4F2526036', 2, 3),
  ('Rahul Patel',       'rahul@campus.edu',          'student', 1, 'TU4F2526037', 2, 3),
  ('Sneha Gupta',       'sneha@campus.edu',          'student', 1, 'TU4F2526038', 2, 3),
  ('Vikash Kumar',      'vikash@campus.edu',         'student', 1, 'TU4F2526039', 2, 3),
  ('Dr. Nisha Rao',     'nisha.rao@campus.edu',      'faculty', 1, NULL,           NULL, NULL),
  ('Prof. Vikram Shah',  'vikram.shah@campus.edu',    'hod',     1, NULL,           NULL, NULL),
  ('Admin User',        'admin@campus.edu',          'admin',   1, NULL,           NULL, NULL)
ON CONFLICT (email) DO NOTHING;

-- Courses
INSERT INTO courses (code, name, department_id, year, semester) VALUES
  ('IT301',  'Data Structures',      1, 2, 3),
  ('IT301L', 'Data Structures Lab',  1, 2, 3),
  ('IT302',  'Database Management',  1, 2, 3),
  ('IT303',  'Operating Systems',    1, 2, 3)
ON CONFLICT (code) DO NOTHING;

-- Faculty-Course assignments (Dr. Nisha teaches IT301, IT301L, IT302; Prof. Vikram teaches IT303)
INSERT INTO faculty_courses (faculty_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'nisha.rao@campus.edu' AND c.code IN ('IT301', 'IT301L', 'IT302')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_courses (faculty_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'vikram.shah@campus.edu' AND c.code = 'IT303'
ON CONFLICT DO NOTHING;

-- Student enrollments (all 5 students in all 4 courses)
INSERT INTO student_courses (student_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.role = 'student' AND u.department_id = 1
ON CONFLICT DO NOTHING;
