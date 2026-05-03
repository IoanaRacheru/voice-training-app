import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Mic, TrendingUp, User } from "lucide-react";
import DuckMark from "./DuckMark";

const navItems = [
  { path: "/", label: "Training", code: "01", icon: Mic },
  { path: "/progress", label: "Progress", code: "02", icon: TrendingUp },
  { path: "/profile", label: "Profile", code: "03", icon: User },
  { path: "/chatbot", label: "Chatbot", code: "04", icon: MessageSquare },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <span className="brand-icon !h-8 !w-10 !bg-foreground !text-foreground !shadow-none">
            <DuckMark />
          </span>
          <div>
            <h1 className="font-display text-xl uppercase leading-none text-foreground">
              VoxShift
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
              Voice training
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        {navItems.map(({ path, label, code, icon: Icon }) => {
          const isActive = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={`relative flex items-center gap-3 px-3 py-3 text-sm font-bold uppercase ${
                isActive
                  ? "bg-white text-foreground"
                  : "text-muted-foreground hover:bg-white hover:text-foreground"
              }`}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary" />}
              <span className="w-7 font-mono text-[11px]">{code}</span>
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
