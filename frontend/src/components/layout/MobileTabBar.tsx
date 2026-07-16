// src/components/layout/MobileTabBar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, School, MapPin, BarChart3 } from '../icons';

export const MobileTabBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'ค้นหา', path: '/', icon: <Search className="w-5 h-5" /> },
    { label: 'ห้องสอบ', path: '/room', icon: <School className="w-5 h-5" /> },
    { label: 'สำรวจ', path: '/explorer', icon: <MapPin className="w-5 h-5" /> },
    { label: 'สถิติ', path: '/stats', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/60 z-30 flex items-center justify-around px-4 pb-safe shadow-lg">
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 select-none transition-all duration-200 ${
              active
                ? 'text-blue-600 dark:text-blue-400 scale-105 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              active ? 'bg-blue-50 dark:bg-blue-950/60 shadow-sm shadow-blue-100/10 dark:shadow-none' : ''
            }`}>
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
