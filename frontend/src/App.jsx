import { useState } from "react";
import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

import AppLayout from "@/components/layout/AppLayout";
import Training from "@/pages/Training";
import Profile from "@/pages/Profile";
import Progress from "@/pages/Progress";

import Login from "@/pages/Login";
import Register from "@/pages/Register";

const AuthenticatedApp = () => {
  const { isAuthenticated } = useAuth();
  const [authPage, setAuthPage] = useState("login");

  if (!isAuthenticated) {
    if (authPage === "register") {
      return <Register onGoToLogin={() => setAuthPage("login")} />;
    }

    return <Login onGoToRegister={() => setAuthPage("register")} />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Training />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthenticatedApp />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;