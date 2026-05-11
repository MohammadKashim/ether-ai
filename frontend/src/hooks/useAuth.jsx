/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { request } from "../lib/api";

const AuthContext = createContext(null);
const storageKey = "task-manager-session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  });

  const isAdmin = session?.user.role === "ADMIN";

  async function login(payload) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSession(data);
    return data;
  }

  async function signup(payload) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSession(data);
    return data;
  }

  function updateSession(nextSession) {
    localStorage.setItem(storageKey, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function logout() {
    localStorage.removeItem(storageKey);
    setSession(null);
  }

  const value = useMemo(
    () => ({ session, token: session?.token, user: session?.user, isAdmin, login, signup, logout, updateSession }),
    [session, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
