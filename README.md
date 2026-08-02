# 🚀 TaskLune – Full-Stack SaaS Project Management Platform

TaskLune is a modern **full-stack SaaS project management platform** built with **HTML, CSS, JavaScript, TypeScript, Node.js, Express.js, and MongoDB**.

It enables individuals and teams to securely organize projects, manage tasks, collaborate, and monitor progress through an intuitive dashboard using **JWT Authentication**, **Refresh Token Rotation**, and a RESTful backend.

It enables users to securely manage projects and tasks through a clean and responsive interface with **JWT Authentication**, **Refresh Token Rotation**, and a RESTful backend.

---

## ✨ Features

### 🔐 Authentication

- User Registration
- User Login
- JWT Access Token Authentication
- Refresh Token Rotation
- HTTP-only Refresh Token Cookies
- Protected API Routes
- Logout
- Logout from All Devices
- Get Current User
- Persistent User Sessions

---

### 📊 Dashboard

- Total Projects
- Total Tasks
- Completed Tasks
- Pending Tasks
- Overdue Tasks
- Completion Percentage
- Recent Activity
- Personalized Welcome Message

---

### 📁 Project Management

- Create Projects
- View Projects
- Update Projects
- Delete Projects
- Project Status Tracking
- MongoDB Persistence

---

### ✅ Task Management

- Create Tasks
- View Tasks
- Update Tasks
- Delete Tasks
- Project-wise Task Organization
- Task Priorities
- Task Status Management
- Due Dates

---

### 📅 Timeline

- Timeline View of Tasks
- Due Date Visualization
- Chronological Task Ordering
- Status Indicators

---

### 👥 Team

- Invite Team Members (Frontend)
- Local Team Management
- Ready for Backend Team API Integration

---

### 🎨 User Experience

- Responsive Design
- Light / Dark Theme
- Loading States
- Empty States
- Clean User Interface
- User-Friendly Error Handling

---

### 🔒 Security

- JWT Authentication
- Refresh Token Rotation
- Password Hashing (bcrypt)
- HTTP-only Refresh Token Cookies
- Helmet Security Headers
- CORS Protection
- Rate Limiting
- Centralized Error Handling
- Environment Variable Validation

---

# 🏗️ Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript (ES6)
- Fetch API

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- MongoDB
- Mongoose

## Authentication

- JWT
- Refresh Tokens
- HTTP-only Cookies

## Storage

- MongoDB (Primary Data Store)
- localStorage (Frontend Cache & UI Preferences)

---

# 📂 Project Structure

```text
TaskLune
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
│   │   ├── utils
│   │   ├── app.ts
│   │   └── index.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── api-client.js
├── app-store.js
├── auth-state.js
├── auth.js
├── dashboard.html
├── dashboard.js
├── index.html
├── signin.html
├── signup.html
├── profile.html
├── settings.html
├── styles.css
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/ShreyaBaidya/tasklune-saas.git

cd tasklune-saas
```

---

## 2. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

---

## 3. Create Environment Variables

Copy the example file.

### Windows

```powershell
copy .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

Update the `.env` file with your own values.

Example:

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/flowsync

# JWT
ACCESS_TOKEN_SECRET=your_super_secure_access_token_secret_here
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_here

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Frontend
CLIENT_URL=http://127.0.0.1:5500

# Cookies
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Environment
NODE_ENV=development
```

---

## 4. Start the Backend

```bash
npm run dev
```

The backend will start on:

```
http://localhost:5000
```

---

## 5. Run the Frontend

Open the project using **VS Code Live Server** (or any static web server).

The frontend communicates with:

```
http://localhost:5000
```

---

# 📡 REST API

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
| PUT | `/api/v1/projects/:projectId` |
| DELETE | `/api/v1/projects/:projectId` |

---

## Tasks

| Method | Endpoint |
|---------|----------|
| GET | `/api/v1/projects/:projectId/tasks` |
| POST | `/api/v1/projects/:projectId/tasks` |
| PUT | `/api/v1/projects/:projectId/tasks/:taskId` |
| DELETE | `/api/v1/projects/:projectId/tasks/:taskId` |

---

# 🔒 Security Features

- JWT Authentication
- Refresh Token Rotation
- Password Hashing using bcrypt
- HTTP-only Cookies
- Helmet
- CORS
- Rate Limiting
- Secure Environment Variables
- Centralized Error Handling

---

# 🚀 Future Enhancements

- Backend Team Management API
- Workspace Invitations
- Role-Based Access Control (RBAC)
- Drag & Drop Kanban Board
- Email Verification
- Forgot Password & Password Reset
- Notifications
- Calendar Integration
- File Attachments
- Docker Support
- CI/CD Pipeline
- Automated Testing

---

# 👩‍💻 Author

**Shreya Baidya**

B.Tech, Electronics and Communication Engineering  
Indian Institute of Technology (ISM) Dhanbad

GitHub: https://github.com/ShreyaBaidya

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!
