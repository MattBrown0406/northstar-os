import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Audit = lazy(() => import("./pages/Audit"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const Report = lazy(() => import("./pages/Report"));
const Coaching = lazy(() => import("./pages/Coaching"));
const CoachDashboard = lazy(() => import("./pages/CoachDashboard"));
const CoachClientReport = lazy(() => import("./pages/CoachClientReport"));
const CoachClientAudit = lazy(() => import("./pages/CoachClientAudit"));
const CoachClientCheckIns = lazy(() => import("./pages/CoachClientCheckIns"));
const BrandedAuth = lazy(() => import("./pages/BrandedAuth"));
const ForExecutives = lazy(() => import("./pages/marketing/ForExecutives"));
const ForCoaches = lazy(() => import("./pages/marketing/ForCoaches"));
const OperatingAudit = lazy(() => import("./pages/marketing/OperatingAudit"));
const AccountabilitySoftware = lazy(() => import("./pages/marketing/AccountabilitySoftware"));
const FaqPage = lazy(() => import("./pages/marketing/FaqPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => <div className="min-h-screen bg-background" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/for-executives" element={<ForExecutives />} />
              <Route path="/for-coaches" element={<ForCoaches />} />
              <Route path="/operating-audit" element={<OperatingAudit />} />
              <Route path="/accountability-software" element={<AccountabilitySoftware />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/check-in" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
              <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
              <Route path="/coaching" element={<ProtectedRoute><Coaching /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
              <Route path="/coach/client/:clientId/report" element={<ProtectedRoute><CoachClientReport /></ProtectedRoute>} />
              <Route path="/coach/client/:clientId/audit" element={<ProtectedRoute><CoachClientAudit /></ProtectedRoute>} />
              <Route path="/coach/client/:clientId/check-ins" element={<ProtectedRoute><CoachClientCheckIns /></ProtectedRoute>} />
              <Route path="/c/:slug" element={<BrandedAuth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
