# CampusGrid — Smart Campus OS

A full-stack campus management platform built with **Next.js 15** (frontend) and **Node.js / Express** (backend), backed by **MongoDB**.

## 🚀 Features

- 🔐 JWT + Google OAuth authentication with role-based access (Student, Faculty, Admin, Placement Cell)
- 📢 Announcements & campus blogs
- 📚 Resource Vault — upload, approve, download study materials
- 💼 Placement / Internship job board
- 🗓️ Timetable & Attendance tracker
- 📝 Assignments management
- 🏆 Leaderboard & Study Groups
- 🔔 Real-time chat (Socket.IO)
- 📍 Lost & Found board
- 🌐 Events management

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT, Google OAuth 2.0 |
| File Storage | Cloudinary |
| Real-time | Socket.IO |
| AI | Google Gemini API |

## 📁 Project Structure

```
SGP/
├── client/   # Next.js frontend
└── server/   # Express backend
```

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Client
```bash
cd client
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev
```

### Server
```bash
cd server
npm install
cp .env.example .env               # fill in your values
npm run dev
```

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@campus.edu | admin123 |
| Faculty | faculty@campus.edu | faculty123 |
| Student | student@campus.edu | student123 |

## 📄 License
MIT
