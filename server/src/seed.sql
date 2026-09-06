-- ========== Seed Data for Terna IT Department ==========

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
  ('KARMAT SHIVANI VAIBHAV', 'TU4F2526001', 'Tu4@f2526001', 'student', 1, 2, 3),
  ('DHABALE GARGI DILIP', 'TU4F2526002', 'Tu4@f2526002', 'student', 1, 2, 3),
  ('SHAIKH AYESHA QAISER', 'TU4F2526003', 'Tu4@f2526003', 'student', 1, 2, 3),
  ('MORE ARYA NIHAL', 'TU4F2526004', 'Tu4@f2526004', 'student', 1, 2, 3),
  ('JADHAV TATHAGAT MAHENDRA', 'TU4F2526005', 'Tu4@f2526005', 'student', 1, 2, 3),
  ('GUPTA HARSH AKHILESH', 'TU4F2526006', 'Tu4@f2526006', 'student', 1, 2, 3),
  ('DHAMALE PURVA RAJENDRA', 'TU4F2526007', 'Tu4@f2526007', 'student', 1, 2, 3),
  ('BAIRU AKHIL PULLAIAH', 'TU4F2526008', 'Tu4@f2526008', 'student', 1, 2, 3),
  ('SHIMPI NIHAR NITIN', 'TU4F2526009', 'Tu4@f2526009', 'student', 1, 2, 3),
  ('RATHOD UTKARSH SUNIL', 'TU4F2526010', 'Tu4@f2526010', 'student', 1, 2, 3),
  ('NARULE ADITYA SIDDHARTH', 'TU4F2526011', 'Tu4@f2526011', 'student', 1, 2, 3),
  ('DHOKRE SHARVARI SANDEEP', 'TU4F2526012', 'Tu4@f2526012', 'student', 1, 2, 3),
  ('NAKADE UMAIR ASLAM', 'TU4F2526013', 'Tu4@f2526013', 'student', 1, 2, 3),
  ('BAGUL KAVERI SANTOSH', 'TU4F2526014', 'Tu4@f2526014', 'student', 1, 2, 3),
  ('PATIL SANIYA SUNIL', 'TU4F2526015', 'Tu4@f2526015', 'student', 1, 2, 3),
  ('SURYAVANSHI SHRADDHA BHAUSAHEB', 'TU4F2526016', 'Tu4@f2526016', 'student', 1, 2, 3),
  ('KADAM DNYNESHWARI DHANAJI', 'TU4F2526017', 'Tu4@f2526017', 'student', 1, 2, 3),
  ('JADHAV NEEL RAVINDRA', 'TU4F2526018', 'Tu4@f2526018', 'student', 1, 2, 3),
  ('MALI SAKSHI TUSHAR', 'TU4F2526019', 'Tu4@f2526019', 'student', 1, 2, 3),
  ('CHAUDHARI LOKESH DHARMENDRA', 'TU4F2526020', 'Tu4@f2526020', 'student', 1, 2, 3),
  ('SUTAR SAKSHI SHAHAJI', 'TU4F2526021', 'Tu4@f2526021', 'student', 1, 2, 3),
  ('MUNGRUSKAR MILHAN ZAHEER AHMED', 'TU4F2526023', 'Tu4@f2526023', 'student', 1, 2, 3),
  ('GOUD ABHISHEKKUMAR ANILKUMAR', 'TU4F2526022', 'Tu4@f2526022', 'student', 1, 2, 3),
  ('BUGADE YASH RAJESH', 'TU4F2526024', 'Tu4@f2526024', 'student', 1, 2, 3),
  ('DESHMANE UTKARSH ANNA', 'TU4F2526025', 'Tu4@f2526025', 'student', 1, 2, 3),
  ('BHAT TANISH TUSHAR', 'TU4F2526026', 'Tu4@f2526026', 'student', 1, 2, 3),
  ('PATEL MAYUR HARISH', 'TU4F2526027', 'Tu4@f2526027', 'student', 1, 2, 3),
  ('TANDA HARSHMANN SINGH KULVINDER SINGH', 'TU4F2526028', 'Tu4@f2526028', 'student', 1, 2, 3),
  ('KAMBLE SANCHI MAROTI', 'TU4F2526030', 'Tu4@f2526030', 'student', 1, 2, 3),
  ('PAWAR JANAVI DHONDIBA', 'TU4F2526031', 'Tu4@f2526031', 'student', 1, 2, 3),
  ('MHATRE PARAS JITENDRA', 'TU4F2526032', 'Tu4@f2526032', 'student', 1, 2, 3),
  ('BHARDE VEDANT MANOJ', 'TU4F2526033', 'Tu4@f2526033', 'student', 1, 2, 3),
  ('MOHITE TEJASWI DHONDIRAM', 'TU4F2526034', 'Tu4@f2526034', 'student', 1, 2, 3),
  ('CHOUDHARI SIDDHESH DATTATRAY', 'TU4F2526035', 'Tu4@f2526035', 'student', 1, 2, 3),
  ('SUSLADE MANISH SAHEBRAO', 'TU4F2526038', 'Tu4@f2526038', 'student', 1, 2, 3),
  ('MISAL SUMEET RAMESH', 'TU4F2526039', 'Tu4@f2526039', 'student', 1, 2, 3),
  ('DESAI HARSHAD YUVARAJ', 'TU4F2526040', 'Tu4@f2526040', 'student', 1, 2, 3),
  ('MOHITE HARSH SATYAVAN', 'TU4F2526041', 'Tu4@f2526041', 'student', 1, 2, 3),
  ('VISHWAKARMA VIHAAN VIJAY', 'TU4F2526044', 'Tu4@f2526044', 'student', 1, 2, 3),
  ('MUNDE VEDANT KAINANATH', 'TU4F2526042', 'Tu4@f2526042', 'student', 1, 2, 3),
  ('SHAIKH REHAN AMJAD', 'TU4F2526046', 'Tu4@f2526046', 'student', 1, 2, 3),
  ('PATIL AYUSH SURYAKANT', 'TU4F2526051', 'Tu4@f2526051', 'student', 1, 2, 3),
  ('RAUT JAGRUTI JYOTISH', 'TU4F2526052', 'Tu4@f2526052', 'student', 1, 2, 3),
  ('PATIL PRANTIK DATTAPRASAD', 'TU4F2526053', 'Tu4@f2526053', 'student', 1, 2, 3),
  ('MENDON SHREYAS SATISH', 'TU4F2526054', 'Tu4@f2526054', 'student', 1, 2, 3),
  ('GAIKWAD GAURAV RAVINDRA', 'TU4F2526055', 'Tu4@f2526055', 'student', 1, 2, 3),
  ('WAJAGE SANSKRUTI GANESH', 'TU4F2526060', 'Tu4@f2526060', 'student', 1, 2, 3),
  ('KOKITKAR MADHURA PARSHURAM', 'TU4F2526056', 'Tu4@f2526056', 'student', 1, 2, 3),
  ('DIVEKAR KANAK SANDEEP', 'TU4F2526057', 'Tu4@f2526057', 'student', 1, 2, 3),
  ('SHRIKAR AKANKSHA JITENDRA', 'TU4F2526058', 'Tu4@f2526058', 'student', 1, 2, 3),
  ('LOKHANDE ATHARV VIJAY', 'TU4F2526059', 'Tu4@f2526059', 'student', 1, 2, 3),
  ('JADHAV SARVESH ANIL', 'TU4F2526066', 'Tu4@f2526066', 'student', 1, 2, 3),
  ('KUNDE GAURAV SHIRISH', 'TU4F2526065', 'Tu4@f2526065', 'student', 1, 2, 3),
  ('TARE VEDANT SHATRUGHNA', 'TU4F2526064', 'Tu4@f2526064', 'student', 1, 2, 3),
  ('GHARGE PREM SAMBHAJI', 'TU4F2526061', 'Tu4@f2526061', 'student', 1, 2, 3),
  ('SARODE BHAVESH SUBHASH', 'TU4F2526062', 'Tu4@f2526062', 'student', 1, 2, 3),
  ('WOD AYUSH KATAK WOD', 'TU4F2526063', 'Tu4@f2526063', 'student', 1, 2, 3),
  ('ANSARI ALISHA KHURSHID ALAM', 'TU4F2526067', 'Tu4@f2526067', 'student', 1, 2, 3),
  ('PATIL SHREYAS RAVINDRA', 'TU4F2526068', 'Tu4@f2526068', 'student', 1, 2, 3),
  ('SHEWALE RIDDHI KISHOR', 'TU4F2526069', 'Tu4@f2526069', 'student', 1, 2, 3),
  ('KUMARI SACHI SARBJEET', 'TU4F2526070', 'Tu4@f2526070', 'student', 1, 2, 3),
  ('BARAD VEDANG DINESH', 'TU4F2526071', 'Tu4@f2526071', 'student', 1, 2, 3),
  ('SATAM TANVI PRAMOD', 'TU4F2526072', 'Tu4@f2526072', 'student', 1, 2, 3),
  ('PATIL SHREY DATTARAM', 'TU4F2526073', 'Tu4@f2526073', 'student', 1, 2, 3),
  ('NIWATE AREEN RAJENDRA', 'TU4F2526074', 'Tu4@f2526074', 'student', 1, 2, 3),
  ('PAWAR AKSHATA KIRAN', 'TU4F2526075', 'Tu4@f2526075', 'student', 1, 2, 3),
  ('KADAM SAHIL MANESH', 'TU4F2526076', 'Tu4@f2526076', 'student', 1, 2, 3),
  ('SHARMA MANISH RAMBHARAT', 'TU4F2425059', 'Tu4@f2425059', 'student', 1, 2, 3),
  ('ADLIKAR OM CHANDRAKANT', 'TU4F2425065', 'Tu4@f2425065', 'student', 1, 2, 3),
  ('WAYKOLE MOHIT TUSHAR', 'TU4F2425031', 'Tu4@f2425031', 'student', 1, 2, 3),
  ('SHINDE DIYA NITIN', 'TU4F2425061', 'Tu4@f2425061', 'student', 1, 2, 3),
  ('LOKARE AMRUTA MANOJ', 'TU4F2425039', 'Tu4@f2425039', 'student', 1, 2, 3),
  ('KHAN ABDULLAH DILFAROZ', 'TU4S2627001', 'Tu4@s2627001', 'student', 1, 2, 3),
  ('KOLEKAR TANMAY BALIRAM', 'TU4S2627002', 'Tu4@s2627002', 'student', 1, 2, 3),
  ('THOMBARE KUNAL PANDURANG', 'TU4S2627003', 'Tu4@s2627003', 'student', 1, 2, 3),
  ('KHEDEKAR AYUSH ANANT', 'TU4S2627004', 'Tu4@s2627004', 'student', 1, 2, 3),
  ('RAKSHE SEJAL SUKHDEV', 'TU4S2627005', 'Tu4@s2627005', 'student', 1, 2, 3),
  ('CHAVAN RITESH CHANDRAKANT', 'TU4S2627006', 'Tu4@s2627006', 'student', 1, 2, 3),
  ('SYKAM TEJASHREE THIRUPATHI', 'TU4S2627007', 'Tu4@s2627007', 'student', 1, 2, 3),
  ('KHAIRE AASTHA AJINKYA', 'TU4S2627008', 'Tu4@s2627008', 'student', 1, 2, 3);

-- Courses
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
