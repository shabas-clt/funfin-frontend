import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, admin } = useAuth();
  const location = useLocation();

  // null means the context is still hydrating from cookie
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0f2f5] dark:bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    const role = String(admin?.role || '').toLowerCase();
    const isAllowed = allowedRoles.includes(role);
    if (!isAllowed) {
      const fallback = role === 'mentor' ? '/mentor/dashboard' : '/admin/dashboard';
      return <Navigate to={fallback} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
