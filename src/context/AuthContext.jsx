import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/api/axios';
import { clearPageCache } from '@/lib/pageCache';

const AuthContext = createContext(null);

const COOKIE_KEY = 'ff_admin_token';
const PROFILE_KEY = 'ff_admin_profile';
const AUTH_EXPIRED_EVENT = 'ff-auth-expired';
const AUTH_FORBIDDEN_EVENT = 'ff-auth-forbidden';

// Profile saved by the last check in this tab. With a token cookie present it
// lets the panel render at once on reload; the server check below still runs
// and logs out if the token or role is no longer valid.
const readCachedProfile = () => {
  if (!Cookies.get(COOKIE_KEY)) return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [cachedProfile] = useState(readCachedProfile);
  // null = still checking, false = unauthenticated, true = authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(cachedProfile ? true : null);
  const [admin, setAdmin] = useState(cachedProfile);

  const logout = useCallback(() => {
    clearPageCache();
    Cookies.remove(COOKIE_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    setIsAuthenticated(false);
    setAdmin(null);
  }, []);

  useEffect(() => {
    const hydrateSession = async () => {
      const token = Cookies.get(COOKIE_KEY);
      if (!token) {
        setIsAuthenticated(false);
        setAdmin(null);
        return;
      }

      try {
        const res = await api.get('/admin-auth/profile');
        const profile = res?.admin || null;
        if (!profile) {
          logout();
          return;
        }

        setAdmin(profile);
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch {
          // ignore storage errors
        }
      } catch {
        logout();
      }
    };

    hydrateSession();
  }, [logout]);

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    const handleRoleForbidden = () => {
      logout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    window.addEventListener(AUTH_FORBIDDEN_EVENT, handleRoleForbidden);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener(AUTH_FORBIDDEN_EVENT, handleRoleForbidden);
    };
  }, [logout]);

  const login = (token, adminProfile) => {
    clearPageCache();
    // SameSite=Strict blocks CSRF; Secure ensures HTTPS-only in prod.
    // Not HttpOnly because JS must read it for Bearer auth headers — backend should
    // ideally set the cookie directly to get true HttpOnly protection.
    Cookies.set(COOKIE_KEY, token, {
      expires: 1,
      secure: location.protocol === 'https:',
      sameSite: 'strict',
    });
    setIsAuthenticated(true);
    if (adminProfile) {
      setAdmin(adminProfile);
      try {
        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(adminProfile));
      } catch {
        // ignore
      }
    } else {
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
