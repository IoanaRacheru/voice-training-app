import React from "react";
import { Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileNav from "./MobileNav";
import { useAuth } from "../../lib/AuthContext";
import DuckMark from "./DuckMark";

export default function Topbar() {
  const { user, logout } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-4 z-30 h-16 mx-4 md:mx-8 mt-4 rounded-[24px] border border-border/70 bg-secondary/95 shadow-[0_12px_24px_rgba(47,42,38,0.08)]">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        
        {/* MOBILE LEFT */}
        <div className="md:hidden flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-64 p-0 bg-sidebar border-sidebar-border"
            >
              <MobileNav />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="brand-icon !w-8 !h-8 !rounded-[14px] !text-[22px]">
              <DuckMark />
            </div>
            <span className="font-bold text-sm">VoxShift</span>
          </div>
        </div>

        {/* SPACER */}
        <div className="hidden md:block" />

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">

          {/* NOTIFICATIONS */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {/* USER + LOGOUT */}
          <div className="flex items-center gap-3 pl-3 border-l border-border/50">
            
            {/* USER TEXT */}
            <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground leading-none">
                  {user?.username || "User"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user?.voice_goal || "Feminize"}
                </p>
            </div>

            {/* AVATAR */}
            <Avatar className="w-9 h-9 border-2 border-primary bg-secondary">
              <AvatarFallback className="bg-primary/45 text-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* 🔴 LOGOUT BUTTON */}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>

          </div>
        </div>
      </div>
    </header>
  );
}
