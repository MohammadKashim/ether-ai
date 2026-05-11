import { Link, useOutletContext } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ClipboardList, Flag, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { Card, Badge } from "../components/ui";

export function DashboardPage() {
  const { dashboard, projects } = useOutletContext();
  const { isAdmin } = useAuth();
  const totals = dashboard?.totals || {};

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<ClipboardList />} label="Total tasks" value={totals.total || 0} />
        <Metric icon={<Flag />} label="High priority" value={totals.highPriority || 0} tone="amber" />
        <Metric icon={<AlertTriangle />} label="Overdue" value={totals.overdue || 0} tone="red" />
        <Metric icon={<CheckCircle2 />} label="Completed" value={totals.done || 0} tone="green" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase text-blue-600">Recent activity</p>
              <h2 className="text-xl font-black">Latest Tasks</h2>
            </div>
            <Link className="text-sm font-bold text-blue-600 hover:text-blue-700" to="/tasks">View all</Link>
          </div>
          <div className="grid gap-3">
            {(dashboard?.recent || []).map((task) => (
              <Link
                to={`/projects/${task.projectId}`}
                className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-200 hover:bg-blue-50"
                key={task.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong>{task.title}</strong>
                  <Badge tone={task.status === "DONE" ? "green" : "blue"}>{task.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-sm text-slate-500">{task.projectName} / {task.assigneeName || "Unassigned"}</p>
              </Link>
            ))}
            {!dashboard?.recent?.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No task activity yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={20} />
            <h2 className="text-xl font-black">Role Access</h2>
          </div>
          <div className="grid gap-2">
            <Permission active label="View assigned projects" />
            <Permission active label="Update assigned task status" />
            <Permission active={isAdmin} label="Create projects and tasks" />
            <Permission active={isAdmin} label="Manage members and user roles" />
            <Permission active={isAdmin} label="Delete projects and tasks" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase text-blue-600">Portfolio</p>
            <h2 className="text-xl font-black">Projects</h2>
          </div>
          <Link className="text-sm font-bold text-blue-600 hover:text-blue-700" to="/projects">Manage projects</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, 6).map((project) => (
            <Link to={`/projects/${project.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-200 hover:bg-blue-50" key={project.id}>
              <strong>{project.name}</strong>
              <p className="mt-1 text-sm text-slate-500">{project.memberCount} members / {project.taskCount} tasks</p>
            </Link>
          ))}
          {!projects.length && <p className="text-sm text-slate-500">No projects yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value, tone = "blue" }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
    green: "text-emerald-600 bg-emerald-50",
  };
  return (
    <Card className="flex items-center gap-4">
      <span className={`grid h-12 w-12 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span>
      <div>
        <strong className="block text-3xl font-black">{value}</strong>
        <span className="text-sm font-semibold text-slate-500">{label}</span>
      </div>
    </Card>
  );
}

function Permission({ active, label }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
      <CheckCircle2 size={15} />
      {label}
    </div>
  );
}
