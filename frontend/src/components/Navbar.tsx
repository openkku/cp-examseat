import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { CONFIG } from '../config';

export const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Helper to check if link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md transition-all duration-350 z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="bg-gradient-to-br from-blue-600 to-sky-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-md shadow-blue-200 dark:shadow-none group-hover:scale-105 transition-transform duration-200">
              CP
            </div>
            <span className="hidden sm:inline-block font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Exam Seat
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-1.5">
            <NavLink to="/" active={isActive('/')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              ค้นหาที่นั่ง
            </NavLink>
            <NavLink to="/room" active={isActive('/room')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              ห้องสอบ
            </NavLink>
            <NavLink to="/explorer" active={isActive('/explorer')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              สำรวจห้องสอบ
            </NavLink>
            <NavLink to="/stats" active={isActive('/stats')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              สถิติ
            </NavLink>

            {/* Dark Mode Toggle (Desktop) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer shadow-sm ml-1"
              title="สลับโหมดมืด/สว่าง"
            >
              {theme === 'dark' ? (
                <svg className="w-4.5 h-4.5 animate-in spin-in-45 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5 animate-in spin-in-45 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* GitHub Link (Desktop) */}
            <a
              href={CONFIG.GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer shadow-sm ml-1 flex items-center justify-center"
              title="GitHub Repository"
            >
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            </a>
          </div>

          {/* Mobile Links (Simplified) */}
          <div className="md:hidden flex items-center space-x-1 text-xs font-bold">
            <Link to="/" className={`px-2 py-1.5 rounded-lg transition-colors ${isActive('/') ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              ค้นหา
            </Link>
            <Link to="/room" className={`px-2 py-1.5 rounded-lg transition-colors ${isActive('/room') ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              ห้องสอบ
            </Link>
            <Link to="/explorer" className={`px-2 py-1.5 rounded-lg transition-colors ${isActive('/explorer') ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              สำรวจ
            </Link>
            <Link to="/stats" className={`px-2 py-1.5 rounded-lg transition-colors ${isActive('/stats') ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              สถิติ
            </Link>

            {/* Separator Divider */}
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0"></span>

            {/* Dark Mode Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="สลับโหมดมืด/สว่าง"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* GitHub Link (Mobile) */}
            <a
              href={CONFIG.GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
              title="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

// Helper Sub-component for desktop links
const NavLink = ({ to, children, active }: { to: string, children: React.ReactNode, active: boolean }) => (
  <Link
    to={to}
    className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${active
        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-100 dark:shadow-none'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
      }`}
  >
    {children}
  </Link>
);