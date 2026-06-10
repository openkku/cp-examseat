import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <div className="h-dvh flex flex-col overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 dark:bg-blue-900/10 blur-[120px] pointer-events-none z-0 transition-colors duration-300"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-200/40 dark:bg-sky-900/10 blur-[120px] pointer-events-none z-0 transition-colors duration-300"></div>

      {/* 1. Fixed Navbar */}
      <Navbar />
      
      {/* 2. Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col z-10">
        <Outlet />
      </main>
    </div>
  );
};