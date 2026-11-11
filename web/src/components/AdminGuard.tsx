import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth-context";

function isAdmin(role: string): boolean {
  return role === "admin" || role === "super_admin";
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-3xl items-center px-4 sm:px-6">
        <div className="admin-bay-glow pointer-events-none absolute inset-x-0 top-0 h-48" aria-hidden />
        <p className="relative text-steel">Loading admin bay…</p>
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  if (!isAdmin(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
