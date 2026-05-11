import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button, Card, Field, inputClass } from "../components/ui";

export function ProjectsPage() {
  const { projects, api, refresh, setError } = useOutletContext();
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({ name: "", description: "" });

  async function createProject(event) {
    event.preventDefault();
    try {
      await api("/projects", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", description: "" });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <div className="mb-4">
          <p className="text-xs font-extrabold uppercase text-blue-600">Projects</p>
          <h2 className="text-xl font-black">Project Directory</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => {
            const progress = project.taskCount ? Math.round((project.doneCount / project.taskCount) * 100) : 0;
            return (
              <Link to={`/projects/${project.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-200 hover:bg-blue-50" key={project.id}>
                <div className="flex justify-between gap-3">
                  <strong>{project.name}</strong>
                  <span className="text-sm font-black text-blue-600">{progress}%</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description || "No description"}</p>
                <p className="mt-4 text-xs font-bold uppercase text-slate-400">{project.memberCount} members / {project.taskCount} tasks</p>
              </Link>
            );
          })}
          {!projects.length && <p className="text-sm text-slate-500">No projects yet.</p>}
        </div>
      </Card>

      {isAdmin && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Plus className="text-blue-600" size={20} />
            <h2 className="text-xl font-black">Create Project</h2>
          </div>
          <form className="grid gap-3" onSubmit={createProject}>
            <Field label="Name">
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className={`${inputClass} min-h-28`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Button type="submit"><Plus size={16} /> Create project</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
