import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Folder, Award, MessageSquare, FileText, ShieldCheck,
  Settings, HelpCircle, X, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';



const menus = [
  { header: 'Menu' },
  { name: 'Dashboards', path: '/admin/dashboard', icon: LayoutDashboard, isDropdown: true },
  { name: 'Admins', path: '/admin/admins', icon: Users, isDropdown: false },
  { name: 'Students', path: '/admin/students', icon: GraduationCap, isDropdown: false },
  { name: 'Course', path: '/admin/courses', icon: BookOpen, isDropdown: false },
  { name: 'Resource', path: '#', icon: Folder, isDropdown: true },
  { name: 'Certificate', path: '#', icon: Award, isDropdown: false },
  { name: 'Chat', path: '#', icon: MessageSquare, isDropdown: false },
  { name: 'Pages', path: '#', icon: FileText, isDropdown: true },
  { name: 'Authentication', path: '#', icon: ShieldCheck, isDropdown: true },
  { header: 'Help' },
  { name: 'Settings', path: '#', icon: Settings, isDropdown: false },
  { name: 'Support', path: '#', icon: HelpCircle, isDropdown: true },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

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
              const isActive = location.pathname.startsWith(item.path) && item.path !== '#';

              return (
                <NavLink
                  key={index}
                  to={item.path}
                  onClick={(e) => {
                    if (item.path === '#') e.preventDefault();
                    if (window.innerWidth < 1024 && item.path !== '#') setIsOpen(false);
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
                  {item.isDropdown && (
                    <ChevronDown className={cn("w-4 h-4", isActive ? "text-[#6366f1]" : "text-slate-400 group-hover:text-[#6366f1]")} />
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className="mt-10 rounded-xl bg-slate-50 dark:bg-neutral-900 p-4 mx-2 relative overflow-hidden border border-slate-100/60 dark:border-neutral-800/80">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-[13px] font-bold text-[#0f172a] dark:text-white">New Features available</h4>
              <button className="text-slate-400 hover:text-slate-600 text-xs"><X className="w-3.5 h-3.5" /></button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">Check out the new dashboard view. Pages now load faster.</p>
            <div className="h-20 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-violet-600"></div>
              <div className="relative z-10 p-2.5 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Platform update</p>
                <p className="text-[13px] font-black uppercase leading-tight mt-0.5">TRADE<br /><span className="text-yellow-300">SMARTER</span></p>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
