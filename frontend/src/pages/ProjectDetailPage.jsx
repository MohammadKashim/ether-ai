import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CalendarClock, Plus, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { emptyTaskForm, isOverdue, priorities, priorityLabels, statuses, statusLabels } from "../lib/constants";
import { Badge, Button, Card, Field, inputClass } from "../components/ui";

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, users, refresh, setError } = useOutletContext();
  const { isAdmin, user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberUserId, setMemberUserId] = useState("");
  const [taskForm, setTaskForm] = useState(emptyTaskForm);

  async function loadDetail() {
    setLoading(true);
    try {
      setDetail(await api(`/projects/${id}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch project detail when this routed page opens or the id changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const progress = detail?.project.taskCount ? Math.round((detail.project.doneCount / detail.project.taskCount) * 100) : 0;

  const availableUsers = useMemo(() => {
    const memberIds = new Set((detail?.members || []).map((member) => member.id));
    return users.filter((item) => !memberIds.has(item.id));
  }, [detail, users]);

  async function addMember(event) {
    event.preventDefault();
    if (!memberUserId) return;
    try {
      await api(`/projects/${id}/members`, { method: "POST", body: JSON.stringify({ userId: Number(memberUserId) }) });
      setMemberUserId("");
      await loadDetail();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeMember(userId) {
    try {
      await api(`/projects/${id}/members/${userId}`, { method: "DELETE" });
      await loadDetail();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    try {
      await api(`/projects/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          ...taskForm,
          assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null,
          dueDate: taskForm.dueDate || null,
        }),
      });
      setTaskForm(emptyTaskForm());
      await loadDetail();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateTaskStatus(task, status) {
    try {
      await api(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadDetail();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(taskId) {
    try {
      await api(`/tasks/${taskId}`, { method: "DELETE" });
      await loadDetail();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteProject() {
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      await refresh();
      navigate("/projects");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Card>Loading project...</Card>;
  if (!detail) return <Card>Project not found.</Card>;

  return (
    <div className="grid gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link className="text-sm font-bold text-blue-600" to="/projects">Back to projects</Link>
            <h2 className="mt-2 text-2xl font-black">{detail.project.name}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{detail.project.description || "No description"}</p>
          </div>
          {isAdmin && (
            <Button variant="danger" onClick={deleteProject}>
              <Trash2 size={16} /> Delete project
            </Button>
          )}
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm font-bold text-slate-600">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <span className="block h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4">
            <p className="text-xs font-extrabold uppercase text-blue-600">Board</p>
            <h2 className="text-xl font-black">Project Tasks</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {statuses.map((status) => (
              <div className="min-h-72 rounded-xl border border-slate-200 bg-slate-50 p-3" key={status}>
                <h3 className="mb-3 text-sm font-black">{statusLabels[status]}</h3>
                <div className="grid gap-3">
                  {detail.tasks
                    .filter((task) => task.status === status)
                    .map((task) => {
                      const canUpdate = isAdmin || task.assigneeId === user.id;
                      return (
                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={task.id}>
                          <div className="flex items-start justify-between gap-3">
                            <strong>{task.title}</strong>
                            <PriorityBadge priority={task.priority} />
                          </div>
                          {task.description && <p className="mt-2 text-sm text-slate-500">{task.description}</p>}
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                            <span>{task.assigneeName || "Unassigned"}</span>
                            <span className={`inline-flex items-center gap-1 ${isOverdue(task) ? "text-red-600" : ""}`}>
                              <CalendarClock size={13} /> {task.dueDate || "No due date"}
                            </span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <select className={inputClass} disabled={!canUpdate} value={task.status} onChange={(event) => updateTaskStatus(task, event.target.value)}>
                              {statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
                            </select>
                            {isAdmin && (
                              <Button variant="danger" className="px-3" onClick={() => deleteTask(task.id)}>
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid content-start gap-6">
          {isAdmin && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                <h2 className="text-xl font-black">Create Task</h2>
              </div>
              <form className="grid gap-3" onSubmit={createTask}>
                <Field label="Title">
                  <input className={inputClass} value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} />
                </Field>
                <Field label="Description">
                  <textarea className={`${inputClass} min-h-24`} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
                </Field>
                <Field label="Assignee">
                  <select className={inputClass} value={taskForm.assigneeId} onChange={(event) => setTaskForm({ ...taskForm, assigneeId: event.target.value })}>
                    <option value="">Unassigned</option>
                    {detail.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                  </select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Priority">
                    <select className={inputClass} value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
                      {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
                    </select>
                  </Field>
                  <Field label="Due date">
                    <input className={inputClass} type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} />
                  </Field>
                </div>
                <Button type="submit"><Plus size={16} /> Add task</Button>
              </form>
            </Card>
          )}

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Team</h2>
              <Badge tone="blue">{detail.members.length} members</Badge>
            </div>
            {isAdmin && (
              <form className="mb-4 grid grid-cols-[1fr_44px] gap-2" onSubmit={addMember}>
                <select className={inputClass} value={memberUserId} onChange={(event) => setMemberUserId(event.target.value)}>
                  <option value="">Add user</option>
                  {availableUsers.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.role})</option>)}
                </select>
                <Button className="px-3" type="submit"><UserPlus size={16} /></Button>
              </form>
            )}
            <div className="grid gap-2">
              {detail.members.map((member) => (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3" key={member.id}>
                  <div>
                    <strong className="block">{member.name}</strong>
                    <span className="text-xs font-bold text-slate-500">{member.role}</span>
                  </div>
                  {isAdmin && member.id !== user.id && (
                    <Button variant="danger" className="px-3" onClick={() => removeMember(member.id)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const tone = priority === "HIGH" ? "red" : priority === "MEDIUM" ? "amber" : "green";
  return <Badge tone={tone}>{priorityLabels[priority]}</Badge>;
}
