import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, User, TrendingUp, Waves } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Training', icon: Mic },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">VoxShift</h1>
            <p className="text-xs text-muted-foreground font-medium">Voice Training</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}