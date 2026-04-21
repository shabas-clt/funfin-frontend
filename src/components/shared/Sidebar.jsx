import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Radio, X, Coins, Tag, Gamepad2, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const adminMenus = [
  { header: 'Overview' },
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { header: 'Management' },
  { name: 'Admins', path: '/admin/admins', icon: Users },
  { name: 'Mentors', path: '/admin/mentors', icon: Radio },
  { name: 'Students', path: '/admin/students', icon: GraduationCap },
  { name: 'Courses', path: '/admin/courses', icon: BookOpen },
  { header: 'Commerce' },
  { name: 'FunCoin', path: '/admin/funcoin', icon: Coins },
  { name: 'Coupons', path: '/admin/coupons', icon: Tag },
  { header: 'Engagement' },
  { name: 'Gamification', path: '/admin/gamification', icon: Gamepad2 },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell },
];

const mentorMenus = [
  { header: 'Mentor Panel' },
  { name: 'Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
  { name: 'Signals', path: '/mentor/signals', icon: Radio },
];

const Sidebar = ({ isOpen, setIsOpen, role = 'admin' }) => {
  const location = useLocation();
  const menus = role === 'mentor' ? mentorMenus : adminMenus;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-black border-r border-slate-100 dark:border-neutral-800 transition-transform duration-300 transform lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between px-6 pt-2">
          <div className="flex items-center">
            <img src="/branding/logo-light.png" alt="FunFin" className="h-8 w-auto max-w-[140px] object-contain block dark:hidden" />
            <img src="/branding/logo-dark.png" alt="FunFin" className="h-12 w-auto max-w-[140px] object-contain hidden dark:block" />
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-neutral-700">
          <div className="space-y-1.5">
            {menus.map((item, index) => {
              if (item.header) {
                return (
                  <div key={index} className="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {item.header}
                  </div>
                );
              }
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={index}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-indigo-50 dark:bg-neutral-900 text-[#6366f1]"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#6366f1] hover:bg-slate-50 dark:hover:bg-neutral-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4.5 h-4.5", isActive ? "text-[#6366f1]" : "text-[#7B86B7] dark:text-neutral-500 group-hover:text-[#6366f1]")} strokeWidth={2} />
                    <span>{item.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
