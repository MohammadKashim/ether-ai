# Team Task Manager

Full-stack task manager built with React, Node.js, Express, JWT authentication, role-based access control, and PostgreSQL.

## Production URLs

- Frontend: `https://kashim-ether-ai.netlify.app`
- Backend: `https://ether-ai-9ue1.onrender.com`

## Frontend deploy settings

Netlify frontend:

```bash
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

Frontend environment variables:

```bash
VITE_API_URL=https://ether-ai-9ue1.onrender.com/api
VITE_BACKEND_BASE_URL=https://ether-ai-9ue1.onrender.com
VITE_APP_BASE_URL=https://kashim-ether-ai.netlify.app
```

## Backend deploy settings

Render backend:

```bash
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Backend environment variables:

```bash
PORT=5000
CLIENT_ORIGIN=https://kashim-ether-ai.netlify.app
API_BASE_URL=https://ether-ai-9ue1.onrender.com
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=change-this-secret
```

Do not use `npm build dev` on Render. Use `npm run build` for the frontend build script. The backend does not have a build step.

## Run the project

Backend:

```bash
cd backend
npm install
npm run dev
```

Backend config lives in `backend/.env`:

```bash
PORT=5000
CLIENT_ORIGIN=https://kashim-ether-ai.netlify.app
API_BASE_URL=https://ether-ai-9ue1.onrender.com
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
VITE_API_URL=https://ether-ai-9ue1.onrender.com/api
VITE_BACKEND_BASE_URL=https://ether-ai-9ue1.onrender.com
VITE_APP_BASE_URL=https://kashim-ether-ai.netlify.app
```

Open `https://kashim-ether-ai.netlify.app`. The API runs at `https://ether-ai-9ue1.onrender.com/api`.

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
