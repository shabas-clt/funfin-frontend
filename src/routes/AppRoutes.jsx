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
import FuncoinManagement from '../pages/admin/funcoin/FuncoinManagement';
import CouponManagement from '../pages/admin/coupons/CouponManagement';
import CourseProgress from '../pages/admin/courses/CourseProgress';
import GamificationManagement from '../pages/admin/gamification/GamificationManagement';
import NotificationBroadcast from '../pages/admin/notifications/NotificationBroadcast';
import LiveChart from '../pages/admin/live-chart/LiveChart';
import LiveEngineDashboard from '../pages/admin/live-engine/Dashboard';
import TokenManagement from '../pages/admin/live-engine/TokenManagement';
import MentorDashboard from '../pages/mentor/dashboard/MentorDashboard';
import MentorSignals from '../pages/mentor/signals/MentorSignals';
import SignIn from '../pages/auth/SignIn';
import PageTransition from '../components/shared/PageTransition';

// New admin panel features
import MemesList from '../pages/admin/memes/MemesList';
import PostingCategories from '../pages/admin/memes/PostingCategories';
import ContentCategories from '../pages/admin/memes/ContentCategories';
import ReferralConfig from '../pages/admin/referrals/ReferralConfig';
import ReferralAnalytics from '../pages/admin/referrals/ReferralAnalytics';
import LeaderboardsPreview from '../pages/admin/leaderboards/LeaderboardsPreview';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        {/* Public auth routes */}
        <Route path="/auth/login" element={<SignIn />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="courses" element={<PageTransition><CourseList /></PageTransition>} />
            <Route path="courses/new" element={<PageTransition><CourseEditor /></PageTransition>} />
            <Route path="courses/:id/edit" element={<PageTransition><CourseEditor /></PageTransition>} />
            <Route path="courses/:id/progress" element={<PageTransition><CourseProgress /></PageTransition>} />
            <Route path="students" element={<PageTransition><StudentManagement /></PageTransition>} />
            <Route path="admins" element={<PageTransition><AdminManagement /></PageTransition>} />
            <Route path="mentors" element={<PageTransition><MentorManagement /></PageTransition>} />
            <Route path="funcoin" element={<PageTransition><FuncoinManagement /></PageTransition>} />
            <Route path="coupons" element={<PageTransition><CouponManagement /></PageTransition>} />
            <Route path="gamification" element={<PageTransition><GamificationManagement /></PageTransition>} />
            <Route path="notifications" element={<PageTransition><NotificationBroadcast /></PageTransition>} />
            <Route path="signals" element={<PageTransition><MentorSignals /></PageTransition>} />
            <Route path="live-chart" element={<PageTransition><LiveChart /></PageTransition>} />
            <Route path="live-engine/dashboard" element={<PageTransition><LiveEngineDashboard /></PageTransition>} />
            <Route path="live-engine/tokens" element={<PageTransition><TokenManagement /></PageTransition>} />
            
            {/* New admin panel features */}
            <Route path="memes" element={<PageTransition><MemesList /></PageTransition>} />
            <Route path="memes/posting-categories" element={<PageTransition><PostingCategories /></PageTransition>} />
            <Route path="memes/content-categories" element={<PageTransition><ContentCategories /></PageTransition>} />
            <Route path="referrals/config" element={<PageTransition><ReferralConfig /></PageTransition>} />
            <Route path="referrals/analytics" element={<PageTransition><ReferralAnalytics /></PageTransition>} />
            <Route path="leaderboards" element={<PageTransition><LeaderboardsPreview /></PageTransition>} />
          </Route>
        </Route>

        {/* Mentor routes */}
        <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
          <Route path="/mentor" element={<MentorLayout />}>
            <Route path="dashboard" element={<PageTransition><MentorDashboard /></PageTransition>} />
            <Route path="courses" element={<PageTransition><CourseList /></PageTransition>} />
            <Route path="courses/new" element={<PageTransition><CourseEditor /></PageTransition>} />
            <Route path="courses/:id/edit" element={<PageTransition><CourseEditor /></PageTransition>} />
            <Route path="courses/:id/progress" element={<PageTransition><CourseProgress /></PageTransition>} />
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
