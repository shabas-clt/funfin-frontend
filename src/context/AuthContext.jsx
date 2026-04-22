import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/api/axios';

const AuthContext = createContext(null);

const COOKIE_KEY = 'ff_admin_token';
const PROFILE_KEY = 'ff_admin_profile';
const AUTH_EXPIRED_EVENT = 'ff-auth-expired';
const AUTH_FORBIDDEN_EVENT = 'ff-auth-forbidden';

export const AuthProvider = ({ children }) => {
  // null = still checking, false = unauthenticated, true = authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [admin, setAdmin] = useState(null);

  const logout = useCallback(() => {
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
