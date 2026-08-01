# 🚀 FlowSync – Full-Stack SaaS Project Management Platform

FlowSync is a **full-stack SaaS project management platform** designed to help individuals and teams efficiently organize projects, manage tasks, and monitor progress through an intuitive dashboard.

The application features **secure JWT-based authentication**, **RESTful APIs**, **MongoDB persistence**, and a responsive frontend with a clean, modern interface supporting both **Light** and **Dark** themes.

---

## 📸 Preview

> **Screenshots**
>
> Add screenshots here after deployment.
>
> - Landing Page
> - Dashboard
> - Project Management
> - Task Board
> - Authentication
> - Light & Dark Mode

---

# ✨ Features

## 🔐 Authentication

- User Registration
- User Login
- JWT Authentication
- Refresh Token Support
- Protected Routes
- Secure Logout
- Session Persistence

---

## 📊 Dashboard

- Total Projects
- Total Tasks
- Completed Tasks
- Pending Tasks
- Overdue Tasks
- Completion Percentage
- Recent Activity Feed
- Personalized Greeting

---

## 📁 Project Management

- Create Projects
- Edit Projects
- Delete Projects
- Project Status Tracking
- Project Statistics

---

## ✅ Task Management

- Create Tasks
- Edit Tasks
- Delete Tasks
- Task Priorities
- Task Status Management
- Due Dates
- Labels
- Search
- Filtering
- Pagination
- Kanban-style Workflow

---

## 🎨 User Experience

- Responsive Design
- Light / Dark Theme
- Modern UI
- Loading States
- Empty States
- User-friendly Error Messages
- Toast Notifications

---

## 🔒 Production Features

- Helmet Security
- Rate Limiting
- Request Validation
- Centralized Error Handling
- Request Logging
- Environment Validation
- Winston Logger
- MongoDB Indexes

---

# 🏗️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (ES6)
- Local Storage
- Fetch API

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

## Security

- Helmet
- Express Rate Limit
- Password Hashing (bcrypt)
- CORS

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
├── dashboard.html
├── dashboard.js
├── app-store.js
├── api-client.js
├── auth.js
├── auth-state.js
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
```

Start the backend:

```bash
npm run dev
```

---

## Frontend

Open the frontend using **VS Code Live Server** or any static server.

Backend runs on:

```
http://localhost:5000
```

---

# 📡 API Overview

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | /api/v1/auth/signup |
| POST | /api/v1/auth/signin |
| POST | /api/v1/auth/signout |
| POST | /api/v1/auth/refresh |
| GET | /api/v1/auth/me |

---

## Dashboard

| Method | Endpoint |
|---------|----------|
| GET | /api/v1/dashboard |

---

## Projects

| Method | Endpoint |
|---------|----------|
| GET | /api/v1/projects |
| POST | /api/v1/projects |
| GET | /api/v1/projects/:id |
| PUT | /api/v1/projects/:id |
| DELETE | /api/v1/projects/:id |

---

## Tasks

| Method | Endpoint |
|---------|----------|
| GET | /api/v1/projects/:projectId/tasks |
| POST | /api/v1/projects/:projectId/tasks |
| GET | /api/v1/projects/:projectId/tasks/:id |
| PUT | /api/v1/projects/:projectId/tasks/:id |
| DELETE | /api/v1/projects/:projectId/tasks/:id |

---

# 🔐 Security Features

- JWT Authentication
- Refresh Token Management
- Password Hashing using bcrypt
- Helmet Security Headers
- Rate Limiting
- CORS Protection
- Centralized Error Handling
- Environment Variable Validation

---

# 🚀 Future Improvements

- Team Collaboration
- Drag-and-Drop Kanban Board
- Email Verification
- Password Reset
- Task Attachments
- Notifications
- Calendar Integration
- Docker Support
- CI/CD Pipeline

---

# 👩‍💻 Author

**Shreya Baidya**

B.Tech – Electronics and Communication Engineering  
IIT (ISM) Dhanbad

GitHub: https://github.com/ShreyaBaidya

---

# 📄 License

This project is licensed under the MIT License.
