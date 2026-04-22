import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, Menu, MessageSquareShare, User, Mail, Users, HelpCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

const Header = ({ setIsSidebarOpen }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme, toggle } = useTheme();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const adminName = admin?.fullName || 'Admin';
  const adminEmail = admin?.email || '';

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Log out now?',
      text: 'Your current session will end on this browser.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setProfileOpen(false);
    logout();
    navigate('/auth/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[72px] shrink-0 bg-white dark:bg-black border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6 z-10 w-full transition-all">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white focus:outline-none p-2 -ml-2 rounded-md hover:bg-slate-50 dark:hover:bg-neutral-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden flex items-center shrink-0">
          <img src="/branding/logo-light.png" alt="FunFin" className="h-7 w-auto max-w-[120px] object-contain block dark:hidden" />
          <img src="/branding/logo-dark.png" alt="FunFin" className="h-7 w-auto max-w-[120px] object-contain hidden dark:block" />
        </div>

        <div className="relative hidden sm:block w-[180px] md:w-[240px] lg:w-[300px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-full text-[13px] font-medium focus:outline-none focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        {/* Theme toggle — visible on all screen sizes, then icon buttons */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors shrink-0"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Icon buttons — desktop only */}
        <div className="hidden sm:flex items-center gap-1">
          <button className="relative p-2 text-[#7B86B7] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
          </button>

          <button className="p-2 text-[#7B86B7] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-full transition-colors">
            <MessageSquareShare className="w-5 h-5" />
          </button>

          <button className="p-2 text-[#7B86B7] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="h-7 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-1 cursor-pointer group hover:bg-slate-50 dark:hover:bg-neutral-900 py-1.5 px-2 rounded-lg transition-colors"
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=6366f1&color=fff&rounded=true`}
              alt="Profile"
              className="w-9 h-9 rounded-full shadow-sm"
            />
            <div className="hidden lg:block text-left">
              <p className="text-[13px] font-semibold text-[#0f172a] dark:text-white leading-tight group-hover:text-[#6366f1] transition-colors">{adminName}</p>
            </div>
            <svg className={`w-4 h-4 text-slate-400 group-hover:text-[#6366f1] transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-[240px] bg-white dark:bg-neutral-950 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-neutral-800 py-4 px-2 z-50">
              <div className="flex items-center gap-3 px-3 pb-4 mb-2 border-b border-slate-100 dark:border-neutral-800">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=6366f1&color=fff&rounded=true`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-[14px] font-bold text-[#0f172a] dark:text-white">{adminName}</p>
                  <p className="text-[11px] font-medium text-slate-400">{adminEmail}</p>
                </div>
              </div>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                  <User className="w-4 h-4 text-slate-400" /> Profile Setting
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                  <Mail className="w-4 h-4 text-slate-400" /> Inbox
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                  <Users className="w-4 h-4 text-slate-400" /> Users
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                  <HelpCircle className="w-4 h-4 text-slate-400" /> Support
                </button>
              </div>
              <div className="px-2 pt-3 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-bold text-white bg-[#ef4444] hover:bg-red-600 rounded-lg shadow-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-slate-200 dark:bg-neutral-800 ml-1 hidden lg:block" />
      </div>
    </header>
  );
};

export default Header;
