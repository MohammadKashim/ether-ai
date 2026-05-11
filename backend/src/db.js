const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Add it to backend/.env.");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

function toPostgresQuery(sql, params = []) {
  if (!Array.isArray(params)) {
    const entries = Object.entries(params);
    let text = sql;
    const values = [];

    entries.forEach(([key, value], index) => {
      const name = key.startsWith("$") ? key : `$${key}`;
      text = text.replaceAll(name, `$${index + 1}`);
      values.push(value);
    });

    return { text, values };
  }

  let index = 0;
  return {
    text: sql.replace(/\?/g, () => `$${++index}`),
    values: params,
  };
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
      priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
      due_date DATE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const { rows } = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority'",
  );
  if (rows.length === 0) {
    await pool.query("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))");
  }
}

async function run(sql, params = []) {
  const query = toPostgresQuery(sql, params);
  const result = await pool.query(query.text, query.values);
  return { ...result, lastInsertRowid: result.rows[0]?.id };
}

async function get(sql, params = []) {
  const query = toPostgresQuery(sql, params);
  const result = await pool.query(query.text, query.values);
  return result.rows[0];
}

async function all(sql, params = []) {
  const query = toPostgresQuery(sql, params);
  const result = await pool.query(query.text, query.values);
  return result.rows;
}

module.exports = { initDb, pool, run, get, all };
