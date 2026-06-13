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
    <div className="mes-login">
      <section className="mes-login__panel">
        <span className="mes-window__corner mes-window__corner--tl" />
        <span className="mes-window__corner mes-window__corner--tr" />
        <span className="mes-window__corner mes-window__corner--bl" />
        <span className="mes-window__corner mes-window__corner--br" />
        <div className="grid justify-items-center gap-4 text-center">
          <div className="mes-login__emblem">
            <img
              src="/branding/merchant-logo.png"
              alt="Merchant Exchange Survival emblem"
            />
          </div>
          <div>
            <div className="mes-login__gate">
              <FaShieldAlt aria-hidden="true" />
              Royal Exchange Access
            </div>
            <h1 className="mes-login__title">
              Merchant Exchange Survival
            </h1>
            <p className="mes-login__copy">
              Enter the guild desk, watch the kingdom markets, and defend your company through rumor, risk, and trade.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="mes-button mes-button--primary mes-button--full mt-6"
        >
          <FaDoorOpen aria-hidden="true" />
          Enter Royal Trading Desk
        </button>

        <p className="mes-login__footnote">
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
      <div className="mes-login">
        <div className="mes-state">
          <div>
            <div className="mes-state__title">Opening the guild gate</div>
            <div className="mes-state__copy">Loading Keycloak session...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return <>{children}</>;
}
