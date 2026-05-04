import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "@/lib/AuthContext";

export default function AppLayout() {
  const { user, updateUser } = useAuth();

  return (
    <div className="relative flex min-h-screen bg-transparent text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar />

        <main className="relative flex-1 p-4 md:p-7 lg:p-9 overflow-auto">
          <Outlet context={{ user, updateUser }} />
        </main>
      </div>
    </div>
  );
}
