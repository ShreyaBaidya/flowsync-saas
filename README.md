# 🚀 FlowSync – Full-Stack SaaS Project Management Platform

FlowSync is a **full-stack SaaS project management platform** that enables users to securely manage projects and tasks through a modern, responsive interface.

The application features **JWT authentication**, **refresh token rotation**, **MongoDB persistence**, **RESTful APIs**, and a clean frontend built with vanilla JavaScript.

---

# 📸 Preview

> Add screenshots after deployment.

- Landing Page
- Sign In / Sign Up
- Dashboard
- Projects
- Tasks
- Timeline
- Team
- Light & Dark Theme

---

# ✨ Features

## 🔐 Authentication

- User Registration
- User Login
- JWT Access Token Authentication
- Refresh Token Rotation
- HTTP-only Refresh Token Cookies
- Protected Routes
- Logout
- Logout from All Devices
- Get Current User
- Session Persistence

---

## 📊 Dashboard

- Total Projects
- Total Tasks
- Completed Tasks
- Pending Tasks
- Overdue Tasks
- Completion Percentage
- Recent Activity
- Personalized Greeting

---

## 📁 Project Management

- Create Projects
- View Projects
- Project Status Tracking
- Project Statistics
- MongoDB Persistence

---

## ✅ Task Management

- Create Tasks
- View Tasks
- Task Priorities
- Task Status Management
- Due Dates
- Project-wise Task Organization
- Timeline Integration

---

## 📅 Timeline

- Chronological task view
- Due date visualization
- Status indicators
- Project-linked tasks

---

## 👥 Team

- Invite team members (frontend)
- Local team management
- Ready for backend Team API integration

---

## 🎨 User Experience

- Responsive Design
- Light / Dark Theme
- Loading States
- Empty States
- Clean UI
- User-friendly Error Messages

---

## 🔒 Security

- JWT Authentication
- Refresh Token Rotation
- Password Hashing (bcrypt)
- HTTP-only Cookies
- Helmet Security Headers
- CORS Protection
- Rate Limiting
- Centralized Error Handling
- Environment Validation

---

# 🏗️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (ES6)
- Fetch API
- Local Storage (UI preferences & frontend cache)

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- MongoDB
- Mongoose

## Authentication

- JWT (JSON Web Tokens)
- Refresh Tokens
- HTTP-only Cookies

---

# 📂 Project Structure

```text
FlowSync
│
├── server
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── types
│   │   └── utils
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── api-client.js
├── app-store.js
├── auth.js
├── auth-state.js
├── dashboard.html
├── dashboard.js
├── profile.html
├── profile.js
├── settings.html
├── settings.js
├── theme.js
└── README.md
```

---

# 🛠️ Installation

## Clone the repository

```bash
git clone https://github.com/ShreyaBaidya/flowsync-saas.git

cd flowsync-saas
```

---

## Backend Setup

```bash
cd server

npm install
```

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/flowsync

JWT_ACCESS_SECRET=your_access_secret

JWT_REFRESH_SECRET=your_refresh_secret

ACCESS_TOKEN_EXPIRES_IN=15m

REFRESH_TOKEN_EXPIRES_IN=7d

CLIENT_URL=http://127.0.0.1:5500
```

Start the backend:

```bash
npm run dev
```

---

## Frontend

Open the frontend using **VS Code Live Server** (or any static web server).

Default backend URL:

```
http://localhost:5000
```

---

# 📡 API Overview

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | `/api/v1/auth/signup` |
| POST | `/api/v1/auth/signin` |
| POST | `/api/v1/auth/refresh` |
| POST | `/api/v1/auth/logout` |
| POST | `/api/v1/auth/logout-all` |
| GET | `/api/v1/auth/me` |

---

## Dashboard

| Method | Endpoint |
|---------|----------|
| GET | `/api/v1/dashboard` |

---

## Projects

| Method | Endpoint |
|---------|----------|
| GET | `/api/v1/projects` |
| POST | `/api/v1/projects` |
| PUT | `/api/v1/projects/:id` |
| DELETE | `/api/v1/projects/:id` |

---

## Tasks

| Method | Endpoint |
|---------|----------|
| GET | `/api/v1/projects/:projectId/tasks` |
| POST | `/api/v1/projects/:projectId/tasks` |
| PUT | `/api/v1/projects/:projectId/tasks/:taskId` |
| DELETE | `/api/v1/projects/:projectId/tasks/:taskId` |

---

# 🔐 Security Features

- JWT Authentication
- Refresh Token Rotation
- Password Hashing using bcrypt
- HTTP-only Refresh Token Cookies
- Helmet Security Headers
- CORS Protection
- Rate Limiting
- Centralized Error Handling
- Environment Variable Validation

---

# 🚀 Future Improvements

- Team Management Backend API
- Workspace Invitations
- Role-Based Access Control (RBAC)
- Drag-and-Drop Kanban Board
- Email Verification
- Password Reset
- Calendar Integration
- File Attachments
- Notifications
- Docker Support
- CI/CD Pipeline
- Automated Testing

---

# 👩‍💻 Author

**Shreya Baidya**

B.Tech – Electronics and Communication Engineering  
IIT (ISM) Dhanbad

GitHub: https://github.com/ShreyaBaidya
