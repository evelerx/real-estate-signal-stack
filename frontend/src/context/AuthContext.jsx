import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "staff_auth_v1";
const SUBSCRIPTION_STORAGE_KEY = "subscription_access_v1";

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.role && parsed.role !== "admin") return null;
    return {
      role: "admin",
      accessToken: parsed.accessToken || null,
      refreshToken: parsed.refreshToken || null,
    };
  } catch {
    return null;
  }
}

function loadStoredSubscription() {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      isUnlocked: Boolean(parsed?.isUnlocked),
      method: parsed?.method || "",
      unlockedAt: parsed?.unlockedAt || null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const stored = loadStoredAuth();
  const storedSubscription = loadStoredSubscription();
  const [role, setRole] = useState(stored?.role || "admin");

  // ================= NEW: JWT TOKENS (MEMORY ONLY) =================
  const [accessToken, setAccessToken] = useState(stored?.accessToken || null);
  const [refreshToken, setRefreshToken] = useState(stored?.refreshToken || null);
  const [subscriptionUnlocked, setSubscriptionUnlocked] = useState(
    storedSubscription?.isUnlocked || false
  );
  const [subscriptionMethod, setSubscriptionMethod] = useState(
    storedSubscription?.method || ""
  );
  const [subscriptionUnlockedAt, setSubscriptionUnlockedAt] = useState(
    storedSubscription?.unlockedAt || null
  );

  // ================= LOGIN / LOGOUT =================
  const login = useCallback((tokens) => {
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    setRole("admin");
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          role: "admin",
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
        })
      );
    } catch {}
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setRole("admin");
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  }, []);

  const unlockWithDemoPaypal = useCallback(() => {
    const now = new Date().toISOString();
    setSubscriptionUnlocked(true);
    setSubscriptionMethod("paypal_demo");
    setSubscriptionUnlockedAt(now);
  }, []);

  const unlockWithReferralCode = useCallback((code) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (normalized !== "OPEN") {
      throw new Error("Invalid referral code");
    }
    const now = new Date().toISOString();
    setSubscriptionUnlocked(true);
    setSubscriptionMethod("referral_open");
    setSubscriptionUnlockedAt(now);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SUBSCRIPTION_STORAGE_KEY,
        JSON.stringify({
          isUnlocked: subscriptionUnlocked,
          method: subscriptionMethod,
          unlockedAt: subscriptionUnlockedAt,
        })
      );
    } catch {}
  }, [subscriptionMethod, subscriptionUnlocked, subscriptionUnlockedAt]);

  useEffect(() => {
    function onUnauthorized() {
      logout();
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout]);

  // ================= CONTEXT VALUE =================
  const value = {
    // --- existing ---
    role,
    setRole,

    isViewer: false,
    isAdmin: role === "admin",

    // --- new ---
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken),
    token: accessToken,

    login,
    logout,

    subscriptionUnlocked,
    subscriptionMethod,
    subscriptionUnlockedAt,
    unlockWithDemoPaypal,
    unlockWithReferralCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
