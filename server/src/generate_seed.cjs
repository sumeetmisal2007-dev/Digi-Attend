const fs = require('fs');
const path = require('path');

// Read the CSV
const csvPath = path.resolve(__dirname, '../../student_db.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');

// Parse the CSV
const lines = csvData.trim().split('\n');
const students = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // A2,TU4F2526001,"KARMAT SHIVANI VAIBHAV",Tu4@f2526001
  // Handle quotes in name
  const match = line.match(/^([^,]+),([^,]+),"([^"]+)",([^,]+)$/);
  if (match) {
    students.push({
      roll: match[1],
      id_no: match[2],
      name: match[3],
      password: match[4]
    });
  } else {
    const parts = line.split(',');
    if (parts.length >= 4) {
      students.push({
        roll: parts[0],
        id_no: parts[1],
        name: parts[2],
        password: parts[3]
      });
    }
  }
}

// Generate the seed SQL
let sql = `-- ========== Seed Data for Terna IT Department ==========

-- Clear existing data
TRUNCATE TABLE audit_log, attendance_records, sessions, student_courses, faculty_courses, courses, users, departments RESTART IDENTITY CASCADE;

-- Department
INSERT INTO departments (name, campus_lat, campus_lng, campus_radius_m)
VALUES ('Information Technology', 19.0330, 73.0297, 200);

-- Users (HOD, Admin, Faculty)
INSERT INTO users (name, roll_number, password, role, department_id, year, semester) VALUES
  ('Sujata Kadu', 'TU0F2526001', 'Tu0@f2526001', 'hod', 1, NULL, NULL),
  ('Add 1', 'TUADF2526001', 'Tuad@f2526001', 'admin', 1, NULL, NULL),
  ('Dakshata shinde', 'TUTF2526001', 'Tut@f2526001', 'faculty', 1, NULL, NULL);

-- Students
INSERT INTO users (name, roll_number, password, role, department_id, year, semester) VALUES
`;

const studentVals = students.map(s => 
  `  ('${s.name.replace(/'/g, "''")}', '${s.id_no}', '${s.password}', 'student', 1, 2, 3)`
);
sql += studentVals.join(',\n') + ';\n\n';

sql += `-- Courses
INSERT INTO courses (code, name, department_id, year, semester) VALUES
  ('IT301', 'CNND', 1, 2, 3),
  ('IT302', 'Operating System', 1, 2, 3);

-- Faculty Course Assignments
-- Sujata Kadu (CNND)
INSERT INTO faculty_courses (faculty_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.roll_number = 'TU0F2526001' AND c.code = 'IT301';

-- Dakshata shinde (Operating System)
INSERT INTO faculty_courses (faculty_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.roll_number = 'TUTF2526001' AND c.code = 'IT302';

-- Student Enrollments
INSERT INTO student_courses (student_id, course_id)
SELECT u.id, c.id FROM users u CROSS JOIN courses c
WHERE u.role = 'student' AND u.department_id = 1;
`;

fs.writeFileSync(path.resolve(__dirname, 'seed.sql'), sql);
console.log('Generated seed.sql with ' + students.length + ' students');
