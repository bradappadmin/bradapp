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
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 sm:px-6">
        <p className="text-steel">Loading…</p>
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
