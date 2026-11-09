import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as api from "./api";
import type { DailyLoginStatus } from "./api";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  dailyLogin: DailyLoginStatus | null;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dailyLogin, setDailyLogin] = useState<DailyLoginStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.fetchMe();
      setUser(res.user);
      setDailyLogin(res.dailyLogin);
    } catch {
      setUser(null);
      setDailyLogin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, dailyLogin, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
