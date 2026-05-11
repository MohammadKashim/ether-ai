export const statuses = ["TODO", "IN_PROGRESS", "DONE"];
export const priorities = ["LOW", "MEDIUM", "HIGH"];

export const statusLabels = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const priorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export function emptyTaskForm() {
  return { title: "", description: "", assigneeId: "", status: "TODO", priority: "MEDIUM", dueDate: "" };
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(`${task.dueDate}T23:59:59`) < new Date();
}
