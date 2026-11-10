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
  /** Saved favourites count for the signed-in user (nav badge). */
  favouriteCount: number;
  refresh: () => Promise<void>;
  refreshTradeInbox: () => Promise<void>;
  refreshFavouriteCount: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [dailyLogin, setDailyLogin] = useState<DailyLoginStatus | null>(null);
  const [pendingTradeInbox, setPendingTradeInbox] = useState(0);
  const [favouriteCount, setFavouriteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshTradeInbox = useCallback(async () => {
    try {
      const res = await api.fetchTradeInboxCount();
      setPendingTradeInbox(Number(res.pendingIncoming) || 0);
    } catch {
      setPendingTradeInbox(0);
    }
  }, []);

  const refreshFavouriteCount = useCallback(async () => {
    try {
      const res = await api.fetchFavouriteCount();
      setFavouriteCount(Number(res.count) || 0);
    } catch {
      setFavouriteCount(0);
    }
  }, []);

  const setUser = useCallback(
    (next: User | null) => {
      setUserState(next);
      if (!next) {
        setPendingTradeInbox(0);
        setFavouriteCount(0);
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
      await Promise.all([refreshTradeInbox(), refreshFavouriteCount()]);
    } catch {
      setUserState(null);
      setDailyLogin(null);
      setPendingTradeInbox(0);
      setFavouriteCount(0);
    } finally {
      setLoading(false);
    }
  }, [refreshTradeInbox, refreshFavouriteCount]);

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
        favouriteCount,
        refresh,
        refreshTradeInbox,
        refreshFavouriteCount,
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
