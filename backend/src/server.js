require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { all, get, initDb, run } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());

const clientOrigin = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173";

app.get(["/", "/login", "/signup"], (_req, res) => {
  res.redirect(clientOrigin);
});

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(120),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(800).optional().default(""),
});

const memberSchema = z.object({ userId: z.number().int().positive() });
const roleSchema = z.object({ role: z.enum(["ADMIN", "MEMBER"]) });

const taskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional().default(""),
  assigneeId: z.number().int().positive().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const taskUpdateSchema = taskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
});

function signUser(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await get("SELECT id, name, email, role FROM users WHERE id = ?", [payload.id]);
    if (!user) return res.status(401).json({ message: "Invalid session" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid session" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
    }
    req.body = parsed.data;
    next();
  };
}

async function canAccessProject(user, projectId) {
  if (user.role === "ADMIN") return true;
  return Boolean(
    await get(
      "SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?",
      [projectId, user.id],
    ),
  );
}

function serializeProject(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    createdAt: row.created_at,
    memberCount: row.member_count || 0,
    taskCount: row.task_count || 0,
    doneCount: row.done_count || 0,
  };
}

function serializeDate(value) {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function serializeTask(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description || "",
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    status: row.status,
    priority: row.priority || "MEDIUM",
    dueDate: serializeDate(row.due_date),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/signup", validate(signupSchema), async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await get("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) return res.status(409).json({ message: "Email is already registered" });

  const count = Number((await get("SELECT COUNT(*) AS total FROM users")).total);
  const finalRole = count === 0 ? "ADMIN" : role;
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await run(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id",
    [name, email, passwordHash, finalRole],
  );
  const user = await get("SELECT id, name, email, role FROM users WHERE id = ?", [result.lastInsertRowid]);
  res.status(201).json({ user: publicUser(user), token: signUser(user) });
});

app.post("/api/auth/login", validate(loginSchema), async (req, res) => {
  const user = await get("SELECT * FROM users WHERE email = ?", [req.body.email]);
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ user: publicUser(user), token: signUser(user) });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get("/api/users", auth, adminOnly, async (_req, res) => {
  const users = await all('SELECT id, name, email, role, created_at AS "createdAt" FROM users ORDER BY name');
  res.json({ users });
});

app.patch("/api/users/:id/role", auth, adminOnly, validate(roleSchema), async (req, res) => {
  const userId = Number(req.params.id);
  const user = await get("SELECT id, role FROM users WHERE id = ?", [userId]);
  if (!user) return res.status(404).json({ message: "User not found" });

  const adminCount = Number((await get("SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN'")).total);
  if (user.id === req.user.id && user.role === "ADMIN" && req.body.role === "MEMBER" && adminCount <= 1) {
    return res.status(400).json({ message: "At least one admin is required" });
  }

  await run("UPDATE users SET role = ? WHERE id = ?", [req.body.role, userId]);
  const updated = await get('SELECT id, name, email, role, created_at AS "createdAt" FROM users WHERE id = ?', [userId]);
  res.json({ user: updated });
});

app.get("/api/projects", auth, async (req, res) => {
  const params = req.user.role === "ADMIN" ? [] : [req.user.id];
  const where =
    req.user.role === "ADMIN"
      ? ""
      : "WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)";
  const rows = await all(
    `
    SELECT p.*, u.name AS owner_name,
      COUNT(DISTINCT pm.user_id)::int AS member_count,
      COUNT(DISTINCT t.id)::int AS task_count,
      SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END)::int AS done_count
    FROM projects p
    JOIN users u ON u.id = p.owner_id
    LEFT JOIN project_members pm ON pm.project_id = p.id
    LEFT JOIN tasks t ON t.project_id = p.id
    ${where}
    GROUP BY p.id, u.name
    ORDER BY p.created_at DESC
  `,
    params,
  );
  res.json({ projects: rows.map(serializeProject) });
});

app.post("/api/projects", auth, adminOnly, validate(projectSchema), async (req, res) => {
  const result = await run(
    "INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?) RETURNING id",
    [req.body.name, req.body.description, req.user.id],
  );
  await run("INSERT INTO project_members (project_id, user_id) VALUES (?, ?)", [result.lastInsertRowid, req.user.id]);
  const project = await get(
    `SELECT p.*, u.name AS owner_name, 1 AS member_count, 0 AS task_count, 0 AS done_count
     FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?`,
    [result.lastInsertRowid],
  );
  res.status(201).json({ project: serializeProject(project) });
});

app.delete("/api/projects/:id", auth, adminOnly, async (req, res) => {
  await run("DELETE FROM projects WHERE id = ?", [Number(req.params.id)]);
  res.status(204).end();
});

app.get("/api/projects/:id", auth, async (req, res) => {
  const projectId = Number(req.params.id);
  if (!(await canAccessProject(req.user, projectId))) return res.status(403).json({ message: "Project access denied" });

  const project = await get(
    `SELECT p.*, u.name AS owner_name,
      COUNT(DISTINCT pm.user_id)::int AS member_count,
      COUNT(DISTINCT t.id)::int AS task_count,
      SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END)::int AS done_count
     FROM projects p
     JOIN users u ON u.id = p.owner_id
     LEFT JOIN project_members pm ON pm.project_id = p.id
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.id = ?
     GROUP BY p.id, u.name`,
    [projectId],
  );
  if (!project) return res.status(404).json({ message: "Project not found" });

  const members = await all(
    `SELECT u.id, u.name, u.email, u.role
     FROM project_members pm JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ? ORDER BY u.name`,
    [projectId],
  );
  const tasks = await all(
    `SELECT t.*, u.name AS assignee_name
     FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.project_id = ? ORDER BY COALESCE(t.due_date, '9999-12-31'), t.created_at DESC`,
    [projectId],
  );
  res.json({ project: serializeProject(project), members, tasks: tasks.map(serializeTask) });
});

app.post("/api/projects/:id/members", auth, adminOnly, validate(memberSchema), async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await get("SELECT id FROM projects WHERE id = ?", [projectId]);
  const user = await get("SELECT id FROM users WHERE id = ?", [req.body.userId]);
  if (!project || !user) return res.status(404).json({ message: "Project or user not found" });
  await run("INSERT INTO project_members (project_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING", [projectId, req.body.userId]);
  res.status(201).json({ message: "Member added" });
});

app.delete("/api/projects/:id/members/:userId", auth, adminOnly, async (req, res) => {
  await run("DELETE FROM project_members WHERE project_id = ? AND user_id = ?", [
    Number(req.params.id),
    Number(req.params.userId),
  ]);
  res.status(204).end();
});

app.post("/api/projects/:id/tasks", auth, adminOnly, validate(taskSchema), async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await get("SELECT id FROM projects WHERE id = ?", [projectId]);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (req.body.assigneeId) {
    const member = await get("SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?", [
      projectId,
      req.body.assigneeId,
    ]);
    if (!member) return res.status(400).json({ message: "Assignee must be a project member" });
  }

  const result = await run(
    `INSERT INTO tasks (project_id, title, description, assignee_id, status, priority, due_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      projectId,
      req.body.title,
      req.body.description,
      req.body.assigneeId || null,
      req.body.status,
      req.body.priority,
      req.body.dueDate || null,
      req.user.id,
    ],
  );
  const task = await get(
    "SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?",
    [result.lastInsertRowid],
  );
  res.status(201).json({ task: serializeTask(task) });
});

app.patch("/api/tasks/:id", auth, validate(taskUpdateSchema), async (req, res) => {
  const taskId = Number(req.params.id);
  const task = await get("SELECT * FROM tasks WHERE id = ?", [taskId]);
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (!(await canAccessProject(req.user, task.project_id))) return res.status(403).json({ message: "Task access denied" });

  const isAssignee = task.assignee_id === req.user.id;
  if (req.user.role !== "ADMIN" && (!isAssignee || Object.keys(req.body).some((key) => key !== "status"))) {
    return res.status(403).json({ message: "Members can only update their assigned task status" });
  }

  if (req.body.assigneeId) {
    const member = await get("SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?", [
      task.project_id,
      req.body.assigneeId,
    ]);
    if (!member) return res.status(400).json({ message: "Assignee must be a project member" });
  }

  const next = {
    title: req.body.title ?? task.title,
    description: req.body.description ?? task.description,
    assigneeId: Object.prototype.hasOwnProperty.call(req.body, "assigneeId") ? req.body.assigneeId : task.assignee_id,
    status: req.body.status ?? task.status,
    priority: req.body.priority ?? task.priority,
    dueDate: Object.prototype.hasOwnProperty.call(req.body, "dueDate") ? req.body.dueDate : task.due_date,
  };

  await run(
    `UPDATE tasks
     SET title = ?, description = ?, assignee_id = ?, status = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [next.title, next.description || "", next.assigneeId || null, next.status, next.priority, next.dueDate || null, taskId],
  );
  const updated = await get(
    "SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = ?",
    [taskId],
  );
  res.json({ task: serializeTask(updated) });
});

app.delete("/api/tasks/:id", auth, adminOnly, async (req, res) => {
  await run("DELETE FROM tasks WHERE id = ?", [Number(req.params.id)]);
  res.status(204).end();
});

app.get("/api/dashboard", auth, async (req, res) => {
  const memberFilter =
    req.user.role === "ADMIN"
      ? ""
      : "AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = $userId)";
  const assignedFilter = req.user.role === "ADMIN" ? "" : "AND t.assignee_id = $userId";
  const params = req.user.role === "ADMIN" ? {} : { $userId: req.user.id };

  const totals = await get(
    `SELECT
      COUNT(*)::int AS total,
      SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END)::int AS todo,
      SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END)::int AS "inProgress",
      SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END)::int AS done,
      SUM(CASE WHEN priority = 'HIGH' AND status != 'DONE' THEN 1 ELSE 0 END)::int AS "highPriority",
      SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'DONE' THEN 1 ELSE 0 END)::int AS overdue
     FROM tasks t WHERE 1=1 ${req.user.role === "ADMIN" ? "" : assignedFilter}`,
    params,
  );

  const recent = (await all(
    `SELECT t.*, p.name AS project_name, u.name AS assignee_name
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE 1=1 ${memberFilter}
     ORDER BY t.updated_at DESC LIMIT 8`,
    params,
  )).map((row) => ({ ...serializeTask(row), projectName: row.project_name }));

  res.json({
    totals: {
      total: totals.total || 0,
      todo: totals.todo || 0,
      inProgress: totals.inProgress || 0,
      done: totals.done || 0,
      highPriority: totals.highPriority || 0,
      overdue: totals.overdue || 0,
    },
    recent,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Task Manager API running on ${API_BASE_URL}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database", err);
    process.exit(1);
  });
