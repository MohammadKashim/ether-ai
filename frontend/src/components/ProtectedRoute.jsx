import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export function ProtectedRoute({ adminOnly = false }) {
  const { session, isAdmin } = useAuth();
  const outletContext = useOutletContext();

  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet context={outletContext} />;
}
