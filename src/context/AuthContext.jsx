import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

const COOKIE_KEY = 'ff_admin_token';

export const AuthProvider = ({ children }) => {
  // null = still checking, false = unauthenticated, true = authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = Cookies.get(COOKIE_KEY);
    if (token) {
      // Trust the cookie on first mount; the API interceptor will handle expiry
      setIsAuthenticated(true);
      try {
        const stored = sessionStorage.getItem('ff_admin_profile');
        if (stored) setAdmin(JSON.parse(stored));
      } catch {
        // sessionStorage can fail in private mode — not critical
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

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
        sessionStorage.setItem('ff_admin_profile', JSON.stringify(adminProfile));
      } catch {
        // ignore
      }
    }
  };

  const logout = () => {
    Cookies.remove(COOKIE_KEY);
    sessionStorage.removeItem('ff_admin_profile');
    setIsAuthenticated(false);
    setAdmin(null);
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
