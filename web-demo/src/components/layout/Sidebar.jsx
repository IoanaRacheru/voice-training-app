import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Mic, User, TrendingUp } from 'lucide-react';
import DuckMark from './DuckMark';

const navItems = [
  { path: '/', label: 'Training', icon: Mic },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-2rem)] sticky top-4 m-4 mr-0 rounded-[28px] bg-sidebar border border-sidebar-border shadow-[0_18px_34px_rgba(47,42,38,0.10)] overflow-hidden">
      {/* Logo */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="brand-icon">
            <DuckMark />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">VoxShift</h1>
            <p className="text-xs text-muted-foreground font-medium">Voice Training</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_10px_18px_rgba(47,42,38,0.10)]'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
              {label}
              {isActive && (
                <Leaf className="ml-auto w-4 h-4 text-chart-5" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-4 rounded-[24px] bg-secondary border border-border/70 shadow-[0_10px_18px_rgba(47,42,38,0.06)]">
        <p className="text-xs text-muted-foreground mb-1">Daily Goal</p>
        <p className="text-sm font-semibold text-foreground">15 min practice</p>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-3/5 bg-chart-5 rounded-full transition-all duration-500" />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">9 / 15 minutes</p>
      </div>
    </aside>
  );
}
