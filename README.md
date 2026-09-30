# Digital Attendance

A role-based attendance platform for Students, Faculty, and HODs.

## Stack (MERN)

- MongoDB (via Mongoose)
- Express + Node.js backend API
- React + Vite frontend
- Docker Compose for local MongoDB

## Run locally

1. Start MongoDB: `npm run db:up` (or set `MONGODB_URI` in `backend/.env`)
2. Copy `backend/.env.example` to `backend/.env`.
3. Install dependencies: `npm install`, `npm install --prefix backend`, `npm install --prefix frontend`.
4. Seed database: `npm run seed` (or auto-seeds on first startup).
5. Start both applications: `npm run dev`.
6. Open `http://localhost:5173`.

The API runs at `http://localhost:4000` and exposes `/api/health` and `/api/dashboard?role=faculty`.

## Roles

- **Student:** view personal attendance, timetable, and attendance alerts.
- **Faculty:** mark attendance and review course-level records.
- **HOD:** monitor department trends, faculty activity, and course health.
