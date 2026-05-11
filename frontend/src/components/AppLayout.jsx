import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, FolderKanban, LayoutDashboard, LogOut, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { useWorkspace } from "../hooks/useWorkspace";
import { Button, Badge } from "./ui";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: BarChart3 },
  { to: "/admin/users", label: "Admin Users", icon: Users, admin: true },
];

export function AppLayout() {
  const auth = useAuth();
  const workspace = useWorkspace();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-800 bg-slate-950 p-5 text-white lg:flex lg:flex-col">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500">
            <FolderKanban size={21} />
          </span>
          <div>
            <strong className="block">Nimbus Tasks</strong>
            <span className="text-xs text-slate-400">Team task manager</span>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-300" />
            <strong>{auth.isAdmin ? "Admin" : "Member"}</strong>
          </div>
          <p className="text-sm text-slate-400">
            {auth.isAdmin ? "Manage workspace, people, projects, and tasks." : "View projects and update assigned work."}
          </p>
        </div>

        <nav className="grid gap-2">
          {navItems
            .filter((item) => !item.admin || auth.isAdmin)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                      isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
        </nav>

        <button
          className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10"
          onClick={auth.logout}
        >
          <LogOut size={17} /> Logout
        </button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase text-blue-600">Welcome, {auth.user.name}</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">Workspace Control</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={auth.isAdmin ? "violet" : "blue"}>{auth.isAdmin ? "Admin account" : "Member account"}</Badge>
              {workspace.loading && <Badge tone="slate">Syncing</Badge>}
              <Button variant="secondary" onClick={workspace.refresh}>
                <RefreshCw size={16} /> Refresh
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          {workspace.error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              {workspace.error}
            </div>
          )}
          <Outlet context={workspace} />
        </main>
      </div>
    </div>
  );
}
