# Digital Attendance

A role-based attendance platform for Students, Faculty, and HODs.

## Stack

- React + Vite client
- Node.js + Express API
- PostgreSQL database
- Docker Compose for local PostgreSQL

## Run locally

1. Start PostgreSQL: `npm run db:up`
2. Copy `server/.env.example` to `server/.env`.
3. Apply the schema with `psql` or a PostgreSQL client using `server/src/schema.sql`.
4. Install dependencies: `npm install`, `npm install --prefix server`, `npm install --prefix client`.
5. Start both applications: `npm run dev`.
6. Open `http://localhost:5173`.

The API runs at `http://localhost:4000` and exposes `/api/health` and `/api/dashboard?role=faculty`.

## Roles

- **Student:** view personal attendance, timetable, and attendance alerts.
- **Faculty:** mark attendance and review course-level records.
- **HOD:** monitor department trends, faculty activity, and course health.
