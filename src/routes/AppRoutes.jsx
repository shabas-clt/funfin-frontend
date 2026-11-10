import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import MentorLayout from '../layouts/MentorLayout';
import SignIn from '../pages/auth/SignIn';
import PageTransition from '../components/shared/PageTransition';
import { lazyPage } from '../lib/lazyPage';

// Pages load on demand, so the first download is only the shell and the
// page being opened.
const Dashboard = lazyPage(() => import('../pages/admin/dashboard/Dashboard'));
const CourseList = lazyPage(() => import('../pages/admin/courses/CourseList'));
const CourseEditor = lazyPage(() => import('../pages/admin/courses/CourseEditor'));
const StudentManagement = lazyPage(() => import('../pages/admin/students/StudentManagement'));
const AdminManagement = lazyPage(() => import('../pages/admin/admins/AdminManagement'));
const MentorManagement = lazyPage(() => import('../pages/admin/mentors/MentorManagement'));
const FuncoinManagement = lazyPage(() => import('../pages/admin/funcoin/FuncoinManagement'));
const PaymentsManagement = lazyPage(() => import('../pages/admin/payments/PaymentsManagement'));
const ModerationQueue = lazyPage(() => import('../pages/admin/moderation/ModerationQueue'));
const CouponManagement = lazyPage(() => import('../pages/admin/coupons/CouponManagement'));
const CourseProgress = lazyPage(() => import('../pages/admin/courses/CourseProgress'));
const Certificates = lazyPage(() => import('../pages/admin/certificates/Certificates'));
const GamificationManagement = lazyPage(() => import('../pages/admin/gamification/GamificationManagement'));
const NotificationBroadcast = lazyPage(() => import('../pages/admin/notifications/NotificationBroadcast'));
const LiveChart = lazyPage(() => import('../pages/admin/live-chart/LiveChart'));
const LiveEngineDashboard = lazyPage(() => import('../pages/admin/live-engine/Dashboard'));
const TokenManagement = lazyPage(() => import('../pages/admin/live-engine/TokenManagement'));
const MentorDashboard = lazyPage(() => import('../pages/mentor/dashboard/MentorDashboard'));
const MentorSignals = lazyPage(() => import('../pages/mentor/signals/MentorSignals'));

// New admin panel features
const MemesList = lazyPage(() => import('../pages/admin/memes/MemesList'));
const PostingCategories = lazyPage(() => import('../pages/admin/memes/PostingCategories'));
const ContentCategories = lazyPage(() => import('../pages/admin/memes/ContentCategories'));
const ReferralConfig = lazyPage(() => import('../pages/admin/referrals/ReferralConfig'));
const ReferralAnalytics = lazyPage(() => import('../pages/admin/referrals/ReferralAnalytics'));
const ReferralRecords = lazyPage(() => import('../pages/admin/referrals/ReferralRecords'));
const ReferralPayouts = lazyPage(() => import('../pages/admin/referrals/ReferralPayouts'));
const LeaderboardsPreview = lazyPage(() => import('../pages/admin/leaderboards/LeaderboardsPreview'));

// Simulation Trading
const StockCharts = lazyPage(() => import('../pages/admin/simulation/StockCharts'));
const SimulationTrades = lazyPage(() => import('../pages/admin/simulation/SimulationTrades'));
const SimulationStats = lazyPage(() => import('../pages/admin/simulation/SimulationStats'));

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
            <Route path="certificates" element={<PageTransition><Certificates /></PageTransition>} />
            <Route path="students" element={<PageTransition><StudentManagement /></PageTransition>} />
            <Route path="admins" element={<PageTransition><AdminManagement /></PageTransition>} />
            <Route path="mentors" element={<PageTransition><MentorManagement /></PageTransition>} />
            <Route path="funcoin" element={<PageTransition><FuncoinManagement /></PageTransition>} />
            <Route path="payments" element={<PageTransition><PaymentsManagement /></PageTransition>} />
            <Route path="coupons" element={<PageTransition><CouponManagement /></PageTransition>} />
            <Route path="gamification" element={<PageTransition><GamificationManagement /></PageTransition>} />
            <Route path="notifications" element={<PageTransition><NotificationBroadcast /></PageTransition>} />
            <Route path="signals" element={<PageTransition><MentorSignals /></PageTransition>} />
            <Route path="live-chart" element={<PageTransition><LiveChart /></PageTransition>} />
            <Route path="live-engine/dashboard" element={<PageTransition><LiveEngineDashboard /></PageTransition>} />
            <Route path="live-engine/tokens" element={<PageTransition><TokenManagement /></PageTransition>} />
            
            {/* New admin panel features */}
            <Route path="moderation" element={<PageTransition><ModerationQueue /></PageTransition>} />
            <Route path="memes" element={<PageTransition><MemesList /></PageTransition>} />
            <Route path="memes/posting-categories" element={<PageTransition><PostingCategories /></PageTransition>} />
            <Route path="memes/content-categories" element={<PageTransition><ContentCategories /></PageTransition>} />
            <Route path="referrals/config" element={<PageTransition><ReferralConfig /></PageTransition>} />
            <Route path="referrals/analytics" element={<PageTransition><ReferralAnalytics /></PageTransition>} />
            <Route path="referrals/records" element={<PageTransition><ReferralRecords /></PageTransition>} />
            <Route path="referrals/payouts" element={<PageTransition><ReferralPayouts /></PageTransition>} />
            <Route path="leaderboards" element={<PageTransition><LeaderboardsPreview /></PageTransition>} />
            
            {/* Simulation Trading */}
            <Route path="simulation/stocks" element={<PageTransition><StockCharts /></PageTransition>} />
            <Route path="simulation/trades" element={<PageTransition><SimulationTrades /></PageTransition>} />
            <Route path="simulation/stats" element={<PageTransition><SimulationStats /></PageTransition>} />
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
