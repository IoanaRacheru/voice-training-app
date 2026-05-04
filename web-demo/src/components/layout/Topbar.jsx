import React from "react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileNav from "./MobileNav";
import { useAuth } from "../../lib/AuthContext";
import DuckMark from "./DuckMark";

export default function Topbar() {
  const { user, logout } = useAuth();

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-7">
        <div className="md:hidden flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 border-r border-border bg-background p-0">
              <MobileNav />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="brand-icon !h-7 !w-9 !bg-foreground !text-foreground !shadow-none">
              <DuckMark />
            </div>
            <span className="font-display text-lg uppercase">StillCisTho</span>
          </div>
        </div>

        <div className="hidden md:block">
          <span className="font-mono text-[11px] uppercase text-muted-foreground">
            Voice training system
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-none text-foreground">
              {user?.username || "User"}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase text-muted-foreground">
              {user?.voice_goal || "Feminize"}
            </p>
          </div>

          <Avatar className="h-8 w-8 border border-border bg-white">
            <AvatarFallback className="bg-white text-xs font-bold text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
