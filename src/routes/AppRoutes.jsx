import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import MentorLayout from '../layouts/MentorLayout';
import Dashboard from '../pages/admin/dashboard/Dashboard';
import CourseList from '../pages/admin/courses/CourseList';
import CourseEditor from '../pages/admin/courses/CourseEditor';
import StudentManagement from '../pages/admin/students/StudentManagement';
import AdminManagement from '../pages/admin/admins/AdminManagement';
import MentorManagement from '../pages/admin/mentors/MentorManagement';
import MentorDashboard from '../pages/mentor/dashboard/MentorDashboard';
import MentorSignals from '../pages/mentor/signals/MentorSignals';
import SignIn from '../pages/auth/SignIn';
import PageTransition from '../components/shared/PageTransition';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public auth routes */}
        <Route path="/auth/login" element={<SignIn />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="courses" element={<PageTransition><CourseList /></PageTransition>} />
            <Route path="courses/new" element={<PageTransition><CourseEditor /></PageTransition>} />
            <Route path="courses/:id/edit" element={<PageTransition><CourseEditor /></PageTransition>} />
            <Route path="students" element={<PageTransition><StudentManagement /></PageTransition>} />
            <Route path="admins" element={<PageTransition><AdminManagement /></PageTransition>} />
            <Route path="mentors" element={<PageTransition><MentorManagement /></PageTransition>} />
          </Route>
        </Route>

        {/* Mentor routes */}
        <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
          <Route path="/mentor" element={<MentorLayout />}>
            <Route path="dashboard" element={<PageTransition><MentorDashboard /></PageTransition>} />
            <Route path="signals" element={<PageTransition><MentorSignals /></PageTransition>} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
