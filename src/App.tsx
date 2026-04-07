import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Audit from "./pages/Audit";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import Report from "./pages/Report";
import CoachDashboard from "./pages/CoachDashboard";
import CoachClientReport from "./pages/CoachClientReport";
import CoachClientAudit from "./pages/CoachClientAudit";
import CoachClientCheckIns from "./pages/CoachClientCheckIns";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/check-in" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
            <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
            <Route path="/coach/client/:clientId/report" element={<ProtectedRoute><CoachClientReport /></ProtectedRoute>} />
            <Route path="/coach/client/:clientId/audit" element={<ProtectedRoute><CoachClientAudit /></ProtectedRoute>} />
            <Route path="/coach/client/:clientId/check-ins" element={<ProtectedRoute><CoachClientCheckIns /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
