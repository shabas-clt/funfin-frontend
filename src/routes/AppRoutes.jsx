import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/admin/dashboard/Dashboard';
import CourseManagement from '../pages/admin/courses/CourseManagement';
import StudentManagement from '../pages/admin/students/StudentManagement';
import MentorAdminManagement from '../pages/admin/mentors/MentorAdminManagement';
import SignIn from '../pages/auth/SignIn';
import PageTransition from '../components/shared/PageTransition';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public auth routes */}
        <Route path="/auth/login" element={<SignIn />} />

        {/* All admin routes are protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="courses" element={<PageTransition><CourseManagement /></PageTransition>} />
            <Route path="students" element={<PageTransition><StudentManagement /></PageTransition>} />
            <Route path="admins" element={<PageTransition><MentorAdminManagement /></PageTransition>} />
            <Route path="mentors" element={<Navigate to="/admin/admins" replace />} />
          </Route>
        </Route>

        {/* Default redirect to dashboard (ProtectedRoute will intercept if not authed) */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
