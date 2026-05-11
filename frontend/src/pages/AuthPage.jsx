import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { Button, Card, Field, inputClass } from "../components/ui";

export function AuthPage({ mode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (auth.session) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") await auth.signup(form);
      else await auth.login({ email: form.email, password: form.password });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,.18),transparent_30%),linear-gradient(135deg,#f8fafc,#eef4f8,#f7f2ed)] p-4">
      <Card className="w-full max-w-lg p-7 shadow-2xl">
        <div className="mb-6 grid gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
            <FolderKanban size={23} />
          </span>
          <p className="text-xs font-extrabold uppercase text-blue-600">Team Task Manager</p>
          <h1 className="text-3xl font-black leading-tight text-slate-950">
            {mode === "signup" ? "Create your workspace account." : "Login to your workspace."}
          </h1>
          <p className="text-sm text-slate-500">Admins control projects and people. Members focus on assigned work.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
          <Button variant={mode === "login" ? "dark" : "secondary"} onClick={() => navigate("/login")}>Login</Button>
          <Button variant={mode === "signup" ? "dark" : "secondary"} onClick={() => navigate("/signup")}>Signup</Button>
        </div>

        <form className="grid gap-3" onSubmit={submit}>
          {mode === "signup" && (
            <>
              <Field label="Name">
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Role">
                <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="MEMBER">Member - update assigned task status</option>
                  <option value="ADMIN">Admin - manage projects, team, tasks</option>
                </select>
              </Field>
            </>
          )}
          <Field label="Email">
            <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Working..." : mode === "signup" ? "Create account" : "Login"}</Button>
        </form>
      </Card>
    </main>
  );
}
