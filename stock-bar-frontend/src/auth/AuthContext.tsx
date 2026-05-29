import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { FaDoorOpen, FaShieldAlt } from "react-icons/fa";
import { setAccessTokenProvider } from "../trading-desktop/services/apiClient";
import type { DesktopUser, UserRole } from "../trading-desktop/types";
import { initKeycloak, keycloak } from "./keycloak";

type TokenClaims = {
  preferred_username?: string;
  name?: string;
  email?: string;
  sub?: string;
};

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  token?: string;
  user: DesktopUser | null;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<string | undefined>;
  hasAnyRole: (roles: UserRole[]) => boolean;
};

const rolePriority: UserRole[] = ["ADMIN_BAR", "TRADER", "VIEWER"];
const validRoles = new Set<UserRole>(rolePriority);

const AuthContext = createContext<AuthContextValue | null>(null);

function toUserRole(role: string): UserRole | null {
  return validRoles.has(role as UserRole) ? (role as UserRole) : null;
}

function extractRoles(): UserRole[] {
  const roles = new Set<UserRole>();

  keycloak.realmAccess?.roles?.forEach((role) => {
    const validRole = toUserRole(role);
    if (validRole) roles.add(validRole);
  });

  Object.values(keycloak.resourceAccess ?? {}).forEach((access) => {
    access?.roles?.forEach((role) => {
      const validRole = toUserRole(role);
      if (validRole) roles.add(validRole);
    });
  });

  return rolePriority.filter((role) => roles.has(role));
}

function buildUser(): DesktopUser | null {
  if (!keycloak.authenticated) return null;

  const tokenParsed = keycloak.tokenParsed as TokenClaims | undefined;
  const roles = extractRoles();
  const username =
    tokenParsed?.preferred_username ??
    tokenParsed?.email ??
    tokenParsed?.name ??
    tokenParsed?.sub ??
    "authenticated-user";

  return {
    name: tokenParsed?.name ?? username,
    username,
    role: roles[0] ?? "UNASSIGNED",
    roles
  };
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div
      className="grid min-h-screen place-items-center overflow-hidden bg-[#060403] p-6 text-stone-100"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(116, 72, 33, 0.18), transparent 34%), repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 20px), linear-gradient(180deg, #080604 0%, #050403 100%)"
      }}
    >
      <section className="w-full max-w-[460px] rounded-md border border-[#4a3324] bg-[#100b08]/95 p-6 shadow-2xl">
        <div className="grid justify-items-center gap-4 text-center">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-md border border-amber-700/60 bg-black/35 p-2 shadow-[0_0_0_1px_rgba(245,158,11,0.12)]">
            <img
              src="/branding/merchant-logo.png"
              alt="Merchant Exchange Survival emblem"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded border border-amber-700/40 bg-black/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
              <FaShieldAlt aria-hidden="true" />
              Guild Access
            </div>
            <h1 className="text-2xl font-semibold tracking-wide text-stone-50">
              Merchant Exchange Survival
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              Enter the guild desk, watch the kingdom markets, and defend your company through rumor, risk, and trade.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-amber-600/70 bg-amber-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          <FaDoorOpen aria-hidden="true" />
          Enter Market
        </button>

        <p className="mt-4 text-center text-[11px] text-stone-500">
          Authentication is handled by the guild gatekeeper.
        </p>
      </section>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [user, setUser] = useState<DesktopUser | null>(null);

  const syncAuthState = useCallback(() => {
    setIsAuthenticated(Boolean(keycloak.authenticated));
    setToken(keycloak.token);
    setUser(buildUser());
  }, []);

  const refreshToken = useCallback(async () => {
    if (!keycloak.authenticated) return undefined;

    try {
      await keycloak.updateToken(30);
      syncAuthState();
      return keycloak.token;
    } catch (error) {
      console.error("Keycloak token refresh failed", error);
      keycloak.clearToken();
      syncAuthState();
      return undefined;
    }
  }, [syncAuthState]);

  useEffect(() => {
    setAccessTokenProvider(refreshToken);
    return () => setAccessTokenProvider(null);
  }, [refreshToken]);

  useEffect(() => {
    let isMounted = true;

    initKeycloak({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false
    })
      .then(() => {
        if (!isMounted) return;
        syncAuthState();
        setIsReady(true);
      })
      .catch((error) => {
        console.error("Keycloak init failed", error);
        if (!isMounted) return;
        setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [syncAuthState]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (keycloak.authenticated) {
        refreshToken();
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated,
      token,
      user,
      login: () => keycloak.login({ redirectUri: window.location.href }),
      logout: () => keycloak.logout({ redirectUri: window.location.origin }),
      refreshToken,
      hasAnyRole: (roles) => user?.roles.some((role) => roles.includes(role)) ?? false
    }),
    [isAuthenticated, isReady, refreshToken, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated, login } = useAuth();

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#060403] font-mono text-xs uppercase tracking-[0.16em] text-amber-200">
        Loading Keycloak session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return <>{children}</>;
}
