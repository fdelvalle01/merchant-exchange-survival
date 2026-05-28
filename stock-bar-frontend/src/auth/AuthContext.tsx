import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { FaChartLine, FaDoorOpen } from "react-icons/fa";
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
      className="grid min-h-screen place-items-center bg-[#060403] p-6 text-stone-100"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 0%, rgba(132, 85, 38, 0.22), transparent 32%), linear-gradient(180deg, #080604 0%, #050403 100%)"
      }}
    >
      <section className="w-full max-w-md rounded-md border border-[#3b2a1f] bg-[#100b08]/95 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md border border-amber-600/50 bg-black/30 text-amber-300">
            <FaChartLine aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-wide">Merchant Exchange Survival</h1>
            <p className="text-xs text-stone-500">Merchant Command Desk protegido por Keycloak</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-amber-600/70 bg-amber-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-500/25"
        >
          <FaDoorOpen aria-hidden="true" />
          Iniciar sesion
        </button>
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
