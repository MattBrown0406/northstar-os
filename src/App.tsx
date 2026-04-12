import { Suspense, lazy, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";

const lazyWithRecovery = (importPage: () => Promise<{ default: ComponentType<any> }>, key: string) =>
  lazy(async () => {
    try {
      const module = await importPage();

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(`route-retry:${key}`);
      }

      return module;
    } catch (error) {
      if (typeof window !== "undefined") {
        const storageKey = `route-retry:${key}`;
        const hasRetried = window.sessionStorage.getItem(storageKey) === "true";

        if (!hasRetried) {
          window.sessionStorage.setItem(storageKey, "true");
          window.location.reload();
          return new Promise<never>(() => undefined);
        }
      }

      throw error;
    }
  });

const Index = lazyWithRecovery(() => import("./pages/Index"), "Index");
const Auth = lazyWithRecovery(() => import("./pages/Auth"), "Auth");
const ResetPassword = lazyWithRecovery(() => import("./pages/ResetPassword"), "ResetPassword");
const Onboarding = lazyWithRecovery(() => import("./pages/Onboarding"), "Onboarding");
const Audit = lazyWithRecovery(() => import("./pages/Audit"), "Audit");
const Dashboard = lazyWithRecovery(() => import("./pages/Dashboard"), "Dashboard");
const CheckIn = lazyWithRecovery(() => import("./pages/CheckIn"), "CheckIn");
const Report = lazyWithRecovery(() => import("./pages/Report"), "Report");
const Coaching = lazyWithRecovery(() => import("./pages/Coaching"), "Coaching");
const CoachDashboard = lazyWithRecovery(() => import("./pages/CoachDashboard"), "CoachDashboard");
const CoachClientReport = lazyWithRecovery(() => import("./pages/CoachClientReport"), "CoachClientReport");
const CoachClientAudit = lazyWithRecovery(() => import("./pages/CoachClientAudit"), "CoachClientAudit");
const CoachClientCheckIns = lazyWithRecovery(() => import("./pages/CoachClientCheckIns"), "CoachClientCheckIns");
const BrandedAuth = lazyWithRecovery(() => import("./pages/BrandedAuth"), "BrandedAuth");
const ForExecutives = lazyWithRecovery(() => import("./pages/marketing/ForExecutives"), "ForExecutives");
const ForCoaches = lazyWithRecovery(() => import("./pages/marketing/ForCoaches"), "ForCoaches");
const OperatingAudit = lazyWithRecovery(() => import("./pages/marketing/OperatingAudit"), "OperatingAudit");
const AccountabilitySoftware = lazyWithRecovery(() => import("./pages/marketing/AccountabilitySoftware"), "AccountabilitySoftware");
const FaqPage = lazyWithRecovery(() => import("./pages/marketing/FaqPage"), "FaqPage");
const Settings = lazyWithRecovery(() => import("./pages/Settings"), "Settings");
const NotFound = lazyWithRecovery(() => import("./pages/NotFound"), "NotFound");

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="rounded-2xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-soft">
      Loading page…
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteErrorBoundary>
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
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/coaching" element={<ProtectedRoute><Coaching /></ProtectedRoute>} />
                <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
                <Route path="/coach/client/:clientId/report" element={<ProtectedRoute><CoachClientReport /></ProtectedRoute>} />
                <Route path="/coach/client/:clientId/audit" element={<ProtectedRoute><CoachClientAudit /></ProtectedRoute>} />
                <Route path="/coach/client/:clientId/check-ins" element={<ProtectedRoute><CoachClientCheckIns /></ProtectedRoute>} />
                <Route path="/c/:slug" element={<BrandedAuth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
