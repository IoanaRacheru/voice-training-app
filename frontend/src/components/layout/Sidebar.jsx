import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mic, User, TrendingUp, Waves } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Training', icon: Mic },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-purple">
            <Waves className="w-5 h-5 text-white" />
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
                  ? 'bg-primary/10 text-primary glow-purple'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-3 mb-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
        <p className="text-xs text-muted-foreground mb-1">Daily Goal</p>
        <p className="text-sm font-semibold text-foreground">15 min practice</p>
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-3/5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">9 / 15 minutes</p>
      </div>
    </aside>
  );
}