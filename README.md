# Team Task Manager

Full-stack task manager built with React, Node.js, Express, JWT authentication, role-based access control, and PostgreSQL.

## Run locally

Backend:

```bash
cd backend
npm install
npm run dev
```

Backend config lives in `backend/.env`:

```bash
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:5000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=change-this-secret
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend config lives in `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_BASE_URL=http://localhost:5000
VITE_APP_BASE_URL=http://localhost:5173
```

Open `http://127.0.0.1:5173/`. The API runs at `http://localhost:5000/api`.

## Features

- Signup/login with JWT sessions
- Admin and member roles
- Admin project creation and team assignment
- Admin task creation, assignment, priority, status, and due dates
- Members can view assigned project work and update their assigned task status
- Dashboard totals for total, in-progress, completed, and overdue tasks
- Search and filter tasks by status, priority, and assignee
- Admin user role management
- Project progress tracking
- Separate routed pages for Dashboard, Projects, Project Details, Tasks, and Admin Users
- Tailwind CSS frontend styling
- SQL relationships between users, projects, project members, and tasks

## Roles

Admin:

- Create and delete projects
- Add and remove project members
- Create and delete tasks
- Assign tasks to team members
- Set task priority and due dates
- Change users between Admin and Member roles

Member:

- View projects they have been added to
- View tasks in those projects
- Update the status of tasks assigned to them

## Main API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/members`
- `POST /api/projects/:id/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
