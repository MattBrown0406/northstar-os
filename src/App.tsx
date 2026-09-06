import { Suspense, lazy, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import { loadRoute } from "@/routing/loadRoute";
import NativeBindings from "@/components/NativeBindings";

type RouteComponent = ComponentType<Record<string, never>>;

const lazyWithRecovery = (importPage: () => Promise<{ default: RouteComponent }>, key: string) =>
  lazy(() => loadRoute(importPage, key));

const Index = lazyWithRecovery(() => import("./pages/Index"), "Index");
const Sample = lazyWithRecovery(() => import("./pages/Sample"), "Sample");
const Auth = lazyWithRecovery(() => import("./pages/Auth"), "Auth");
const ResetPassword = lazyWithRecovery(() => import("./pages/ResetPassword"), "ResetPassword");
const Onboarding = lazyWithRecovery(() => import("./pages/Onboarding"), "Onboarding");
const Audit = lazyWithRecovery(() => import("./pages/Audit"), "Audit");
const Dashboard = lazyWithRecovery(() => import("./pages/Dashboard"), "Dashboard");
const CheckIn = lazyWithRecovery(() => import("./pages/CheckIn"), "CheckIn");
const Report = lazyWithRecovery(() => import("./pages/Report"), "Report");
const Coaching = lazyWithRecovery(() => import("./pages/Coaching"), "Coaching");
const Subscribe = lazyWithRecovery(() => import("./pages/Subscribe"), "Subscribe");
const AppReviewDemo = lazyWithRecovery(() => import("./pages/AppReviewDemo"), "AppReviewDemo");
const CoachDashboard = lazyWithRecovery(() => import("./pages/CoachDashboard"), "CoachDashboard");
const CoachClientReport = lazyWithRecovery(() => import("./pages/CoachClientReport"), "CoachClientReport");
const CoachClientAudit = lazyWithRecovery(() => import("./pages/CoachClientAudit"), "CoachClientAudit");
const CoachClientCheckIns = lazyWithRecovery(() => import("./pages/CoachClientCheckIns"), "CoachClientCheckIns");
const BrandedAuth = lazyWithRecovery(() => import("./pages/BrandedAuth"), "BrandedAuth");
const ForLeaders = lazyWithRecovery(() => import("./pages/marketing/ForExecutives"), "ForLeaders");
const ForCoaches = lazyWithRecovery(() => import("./pages/marketing/ForCoaches"), "ForCoaches");
const OperatingAudit = lazyWithRecovery(() => import("./pages/marketing/OperatingAudit"), "OperatingAudit");
const AccountabilitySoftware = lazyWithRecovery(() => import("./pages/marketing/AccountabilitySoftware"), "AccountabilitySoftware");
const FaqPage = lazyWithRecovery(() => import("./pages/marketing/FaqPage"), "FaqPage");
const SupportPage = lazyWithRecovery(() => import("./pages/marketing/SupportPage"), "SupportPage");
const PrivacyPage = lazyWithRecovery(() => import("./pages/marketing/PrivacyPage"), "PrivacyPage");
const TermsPage = lazyWithRecovery(() => import("./pages/marketing/TermsPage"), "TermsPage");
const Sharing = lazyWithRecovery(() => import("./pages/Sharing"), "Sharing");
const Settings = lazyWithRecovery(() => import("./pages/Settings"), "Settings");
const NorthStarGoals = lazyWithRecovery(() => import('./pages/NorthStarGoals'), 'NorthStarGoals');
const Admin = lazyWithRecovery(() => import("./pages/Admin"), "Admin");
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
          <NativeBindings />
          <RouteErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/for-leaders" element={<ForLeaders />} />
                <Route path="/for-executives" element={<ForLeaders />} />
                <Route path="/for-coaches" element={<ForCoaches />} />
                <Route path="/operating-audit" element={<OperatingAudit />} />
                <Route path="/accountability-software" element={<AccountabilitySoftware />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/review-demo" element={<AppReviewDemo />} />
                <Route path="/sample" element={<Sample />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/check-in" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/sharing" element={<ProtectedRoute><Sharing /></ProtectedRoute>} />
                <Route path="/coaching" element={<ProtectedRoute><Coaching /></ProtectedRoute>} />
                <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
                <Route path="/goals" element={<ProtectedRoute><NorthStarGoals /></ProtectedRoute>} />
                <Route path="/coach" element={<ProtectedRoute><CoachDashboard /></ProtectedRoute>} />
                <Route path="/coach/client/:clientId/report" element={<ProtectedRoute><CoachClientReport /></ProtectedRoute>} />
                <Route path="/coach/client/:clientId/audit" element={<ProtectedRoute><CoachClientAudit /></ProtectedRoute>} />
                <Route path="/coach/client/:clientId/check-ins" element={<ProtectedRoute><CoachClientCheckIns /></ProtectedRoute>} />
                <Route path="/:slug" element={<BrandedAuth />} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
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
