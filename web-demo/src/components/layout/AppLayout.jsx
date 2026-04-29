import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "@/lib/AuthContext";

export default function AppLayout() {
  const { user, updateUser } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet context={{ user, setUser: updateUser }} />
        </main>
      </div>
    </div>
  );
}