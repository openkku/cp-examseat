// src/components/layout/AppShell.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileTabBar } from './MobileTabBar';

export const AppShell = () => {
  return (
    <div className="h-dvh flex flex-col overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 relative transition-colors duration-300">

      {/* Aurora Glow background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400/10 dark:bg-indigo-900/5 blur-[130px] pointer-events-none z-0 transition-colors duration-300"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-400/10 dark:bg-cyan-900/5 blur-[130px] pointer-events-none z-0 transition-colors duration-300"></div>

      {/* Top Navbar */}
      <Navbar />

      {/* Scrollable Main Content Container */}
      <main className="flex-1 relative overflow-hidden flex flex-col z-10 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Tab Navigation */}
      <MobileTabBar />
    </div>
  );
};
