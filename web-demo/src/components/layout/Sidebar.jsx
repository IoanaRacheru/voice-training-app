import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, MessageSquare, Mic, TrendingUp, User } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import DuckMark from "./DuckMark";

const navItems = [
  { path: "/", label: "Training", code: "01", icon: Mic },
  { path: "/progress", label: "Progress", code: "02", icon: TrendingUp },
  { path: "/profile", label: "Profile", code: "03", icon: User },
  { path: "/chatbot", label: "Chatbot", code: "04", icon: MessageSquare },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-border bg-background/90">
      <div className="px-6 py-7">
        <div className="flex items-center gap-3">
          <span className="brand-icon !h-8 !w-10 !bg-foreground !text-foreground !shadow-none">
            <DuckMark />
          </span>
          <div>
            <h1 className="font-display text-xl uppercase leading-none text-foreground">
              StillCisTho
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
              Voice training
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        {navItems.map(({ path, label, code, icon: Icon }) => {
          const isActive = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={`relative flex items-center gap-3 px-3 py-3 text-sm font-bold uppercase transition-colors ${
                isActive
                  ? "bg-white text-foreground"
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary" />}
              <span className="w-7 font-mono text-[11px] text-muted-foreground">{code}</span>
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-6 mb-6 border-t border-border pt-5">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">
          Signed in
        </p>
        <p className="mt-1 truncate text-sm font-bold text-foreground">
          {user?.username || "User"}
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
