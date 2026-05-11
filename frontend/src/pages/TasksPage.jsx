import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { CalendarClock, Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { isOverdue, priorities, priorityLabels, statuses, statusLabels } from "../lib/constants";
import { Badge, Button, Card, inputClass } from "../components/ui";

export function TasksPage() {
  const { projects, api, refresh, setError } = useOutletContext();
  const { isAdmin, user } = useAuth();
  const [details, setDetails] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "ALL", priority: "ALL" });

  useEffect(() => {
    async function loadTasks() {
      try {
        const projectDetails = await Promise.all(projects.map((project) => api(`/projects/${project.id}`)));
        setDetails(projectDetails);
      } catch (err) {
        setError(err.message);
      }
    }

    if (projects.length) loadTasks();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setDetails([]);
  }, [api, projects, setError]);

  const tasks = useMemo(
    () =>
      details.flatMap((detail) =>
        detail.tasks.map((task) => ({
          ...task,
          projectName: detail.project.name,
        })),
      ),
    [details],
  );

  const filteredTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search) ||
        task.projectName.toLowerCase().includes(search) ||
        (task.assigneeName || "").toLowerCase().includes(search);
      const matchesStatus = filters.status === "ALL" || task.status === filters.status;
      const matchesPriority = filters.priority === "ALL" || task.priority === filters.priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [filters, tasks]);

  async function updateTaskStatus(task, status) {
    try {
      await api(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
      const projectDetails = await Promise.all(projects.map((project) => api(`/projects/${project.id}`)));
      setDetails(projectDetails);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase text-blue-600">Tasks</p>
          <h2 className="text-xl font-black">All Project Tasks</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-[260px_160px_160px]">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              className="min-h-10 w-full border-0 bg-transparent text-sm outline-none"
              placeholder="Search tasks"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </label>
          <select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="ALL">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
          <select className={inputClass} value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
            <option value="ALL">All priorities</option>
            {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[1.4fr_1fr_160px_150px_150px] bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
          <span>Task</span>
          <span>Project</span>
          <span>Assignee</span>
          <span>Due</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredTasks.map((task) => {
            const canUpdate = isAdmin || task.assigneeId === user.id;
            return (
              <div className="grid grid-cols-[1.4fr_1fr_160px_150px_150px] items-center gap-3 px-4 py-3 text-sm" key={task.id}>
                <div>
                  <strong className="block">{task.title}</strong>
                  <Badge tone={task.priority === "HIGH" ? "red" : task.priority === "MEDIUM" ? "amber" : "green"}>{priorityLabels[task.priority]}</Badge>
                </div>
                <Link className="font-bold text-blue-600" to={`/projects/${task.projectId}`}>{task.projectName}</Link>
                <span className="text-slate-500">{task.assigneeName || "Unassigned"}</span>
                <span className={`inline-flex items-center gap-1 font-bold ${isOverdue(task) ? "text-red-600" : "text-slate-500"}`}>
                  <CalendarClock size={14} /> {task.dueDate || "No date"}
                </span>
                <select className={inputClass} disabled={!canUpdate} value={task.status} onChange={(event) => updateTaskStatus(task, event.target.value)}>
                  {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </select>
              </div>
            );
          })}
          {!filteredTasks.length && <p className="p-4 text-sm text-slate-500">No tasks match your filters.</p>}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={refresh}>Refresh tasks</Button>
      </div>
    </Card>
  );
}
