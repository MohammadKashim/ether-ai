import { useOutletContext } from "react-router-dom";
import { Crown, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { Badge, Card, inputClass } from "../components/ui";

export function AdminUsersPage() {
  const { users, api, refresh, setError } = useOutletContext();
  const auth = useAuth();

  async function updateRole(userId, role) {
    try {
      const data = await api(`/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      if (userId === auth.user.id) {
        auth.updateSession({ ...auth.session, user: data.user });
      }
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Users className="text-blue-600" size={22} />
          <div>
            <p className="text-xs font-extrabold uppercase text-blue-600">Admin</p>
            <h2 className="text-xl font-black">User & Role Management</h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[1.2fr_1fr_160px] bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
          </div>
          <div className="divide-y divide-slate-200">
            {users.map((user) => (
              <div className="grid grid-cols-[1.2fr_1fr_160px] items-center gap-3 px-4 py-3 text-sm" key={user.id}>
                <strong>{user.name}</strong>
                <span className="truncate text-slate-500">{user.email}</span>
                <select className={inputClass} value={user.role} onChange={(event) => updateRole(user.id, event.target.value)}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Crown className="text-amber-500" size={20} />
          <h2 className="text-xl font-black">Role Rules</h2>
        </div>
        <div className="grid gap-3 text-sm text-slate-600">
          <p><Badge tone="violet">Admin</Badge> can create projects, assign members, create/delete tasks, and change roles.</p>
          <p><Badge tone="blue">Member</Badge> can view assigned project data and update assigned task status.</p>
          <p className="rounded-xl bg-amber-50 p-3 font-bold text-amber-800">The backend prevents removing the final admin account.</p>
        </div>
      </Card>
    </div>
  );
}
