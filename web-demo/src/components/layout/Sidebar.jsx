import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import DuckMark from "./DuckMark";
import { navItems } from "./navItems";
import { getUserDisplayName } from "@/lib/userDisplay";

export default function Sidebar({ collapsed = false, onToggleCollapse }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const displayName = getUserDisplayName(user, { fallbackToEmail: true });

  return (
    <aside
      className={`hidden md:flex h-screen shrink-0 flex-col border-r border-border bg-background/90 transition-[width] duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="px-4 py-4">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-9 w-9 items-center justify-center border border-border bg-white text-foreground hover:border-primary"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <span className="brand-icon !h-8 !w-10 !bg-foreground !text-foreground !shadow-none">
            <DuckMark />
          </span>
          {!collapsed && (
            <div>
              <h1 className="font-display text-xl uppercase leading-none text-foreground">
                StillCisTho
              </h1>
              <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
                Voice training
              </p>
            </div>
          )}
        </div>
      </div>

      {!collapsed ? (
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
      ) : (
        <div className="flex-1" />
      )}

      <div className={`${collapsed ? "mx-2" : "mx-6"} mb-6 border-t border-border pt-5`}>
        {!collapsed && (
          <>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              Signed in
            </p>
            <p className="mt-1 break-words text-sm font-bold text-foreground">
              {displayName}
            </p>
          </>
        )}
        <button
          type="button"
          onClick={logout}
          className={`mt-5 inline-flex items-center text-xs font-bold uppercase text-muted-foreground hover:text-primary ${
            collapsed ? "w-full justify-center" : "gap-2"
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
