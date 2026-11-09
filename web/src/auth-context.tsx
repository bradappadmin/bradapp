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
  /** Pending incoming free-trade offers for the signed-in user. */
  pendingTradeInbox: number;
  refresh: () => Promise<void>;
  refreshTradeInbox: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [dailyLogin, setDailyLogin] = useState<DailyLoginStatus | null>(null);
  const [pendingTradeInbox, setPendingTradeInbox] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshTradeInbox = useCallback(async () => {
    try {
      const res = await api.fetchTradeInboxCount();
      setPendingTradeInbox(Number(res.pendingIncoming) || 0);
    } catch {
      setPendingTradeInbox(0);
    }
  }, []);

  const setUser = useCallback(
    (next: User | null) => {
      setUserState(next);
      if (!next) {
        setPendingTradeInbox(0);
        setDailyLogin(null);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const res = await api.fetchMe();
      setUserState(res.user);
      setDailyLogin(res.dailyLogin);
      await refreshTradeInbox();
    } catch {
      setUserState(null);
      setDailyLogin(null);
      setPendingTradeInbox(0);
    } finally {
      setLoading(false);
    }
  }, [refreshTradeInbox]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        dailyLogin,
        pendingTradeInbox,
        refresh,
        refreshTradeInbox,
        setUser,
      }}
    >
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
