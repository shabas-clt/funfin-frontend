import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import Header from '../components/shared/Header';

const MentorLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F0f2f5] dark:bg-black text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} role="mentor" />

      <div className="flex flex-col flex-1 w-full min-w-0 transition-all duration-300">
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MentorLayout;
