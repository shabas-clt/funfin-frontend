import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/admin/dashboard/Dashboard';
import CourseManagement from '../pages/admin/courses/CourseManagement';
import StudentManagement from '../pages/admin/students/StudentManagement';
import MentorAdminManagement from '../pages/admin/mentors/MentorAdminManagement';
import PageTransition from '../components/shared/PageTransition';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="courses" element={<PageTransition><CourseManagement /></PageTransition>} />
          <Route path="students" element={<PageTransition><StudentManagement /></PageTransition>} />
          <Route path="mentors" element={<PageTransition><MentorAdminManagement /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
