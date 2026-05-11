import { useCallback, useEffect, useState } from "react";
import { request } from "../lib/api";
import { useAuth } from "./useAuth.jsx";

export function useWorkspace() {
  const { token, isAdmin, session } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const api = useCallback((path, options = {}) => request(path, { token, ...options }), [token]);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [dashboardData, projectData, userData] = await Promise.all([
        api("/dashboard"),
        api("/projects"),
        isAdmin ? api("/users") : Promise.resolve({ users: [] }),
      ]);
      setDashboard(dashboardData);
      setProjects(projectData.projects);
      setUsers(userData.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, isAdmin, session]);

  useEffect(() => {
    // Load workspace data when the authenticated route layout mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { api, dashboard, projects, users, loading, error, setError, refresh };
}
