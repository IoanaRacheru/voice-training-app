import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { useAuth } from "@/lib/AuthContext";

import AppLayout from "@/components/layout/AppLayout";
import DuckNatureBackdrop from "@/components/layout/DuckNatureBackdrop";
import Training from "@/pages/Training";
import Profile from "@/pages/Profile";
import Progress from "@/pages/Progress";
import Chatbot from "@/pages/Chatbot";

const AuthenticatedApp = () => {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Training />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <div className="relative min-h-screen overflow-hidden">
        <DuckNatureBackdrop />
        <div className="relative z-10 min-h-screen">
          <Router>
            <AuthenticatedApp />
          </Router>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
