import React from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileNav from "./MobileNav";

export default function AppLayout() {
  const { user, updateUser } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="relative flex min-h-screen bg-transparent text-foreground">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />

      <div className="relative flex-1 flex flex-col min-h-screen min-w-0">
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 md:hidden">
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
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="fixed left-4 top-4 z-20 hidden h-9 w-9 items-center justify-center border border-border bg-card text-foreground hover:border-primary md:inline-flex"
            aria-label="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <main className={`relative flex-1 overflow-auto p-4 md:p-7 lg:p-9 ${collapsed ? "md:pl-16" : ""}`}>
          <Outlet context={{ user, updateUser }} />
        </main>
      </div>
    </div>
  );
}
