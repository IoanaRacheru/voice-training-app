import React from "react";
import { Bell, Menu, Waves, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileNav from "./MobileNav";
import { useAuth } from "../../lib/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();

  const initials = user?.username
  ? user.username
      .split(/[\s._-]/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  : "U";

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Waves className="w-3.5 h-3.5 text-white" />
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
                {user?.voice_goal === "masculinize"
                  ? "Masculinize"
                  : "Feminize"}{" "}
                Goal
              </p>
            </div>

            {/* AVATAR */}
            <Avatar className="w-9 h-9 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground text-xs font-semibold">
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