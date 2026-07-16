// src/components/layout/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { CONFIG } from '../../config';
import { Sun, Moon, Github, Search, School, MapPin, BarChart3 } from '../icons';

export const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'ค้นหาที่นั่ง', path: '/', icon: <Search className="w-4 h-4" /> },
    { label: 'ห้องสอบ', path: '/room', icon: <School className="w-4 h-4" /> },
    { label: 'สำรวจห้องสอบ', path: '/explorer', icon: <MapPin className="w-4 h-4" /> },
    { label: 'สถิติ', path: '/stats', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="w-full border-b border-slate-200/40 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/75 backdrop-blur-md transition-all duration-350 z-20 shrink-0">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-md shadow-indigo-200/50 dark:shadow-none group-hover:scale-105 transition-transform duration-200">
              CP
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm md:text-base tracking-tight text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Exam Seat
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                College of Computing
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links & Controls */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1.5">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-100/10 dark:shadow-none'
                        : 'text-slate-600 dark:text-slate-450 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Nav Controls separator (Desktop) */}
            <span className="hidden md:block h-4 w-px bg-slate-200 dark:bg-slate-800"></span>

            {/* Quick Actions (Theme Toggle & Github) */}
            <div className="flex items-center gap-1.5">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
                title="สลับโหมดมืด/สว่าง"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 animate-in spin-in-45 duration-300" />
                ) : (
                  <Moon className="w-4 h-4 animate-in spin-in-45 duration-300" />
                )}
              </button>

              {/* GitHub Link */}
              <a
                href={CONFIG.GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
                title="GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
