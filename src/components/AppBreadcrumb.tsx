import { Link, useLocation, useParams } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  audit: "Audit",
  "check-in": "Check-in",
  report: "Report",
  coaching: "AI Coach",
  settings: "Settings",
  admin: "Admin",
  coach: "Coach Portal",
  onboarding: "Onboarding",
  "for-leaders": "For Leaders",
  "for-executives": "For Leaders",
  "for-coaches": "For Coaches",
  "operating-audit": "Operating Audit",
  "accountability-software": "Accountability Software",
  faq: "FAQ",
  auth: "Sign In",
  "reset-password": "Reset Password",
};

const COACH_SUB_LABELS: Record<string, string> = {
  report: "Client Report",
  audit: "Client Audit",
  "check-ins": "Client Check-ins",
};

const AppBreadcrumb = () => {
  const location = useLocation();
  const params = useParams();
  const path = location.pathname;

  const crumbs: BreadcrumbEntry[] = [];

  // Build crumbs from path segments
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  // Coach client sub-pages: /coach/client/:clientId/report
  if (segments[0] === "coach" && segments[1] === "client" && segments.length >= 4) {
    crumbs.push({ label: "Coach Portal", href: "/coach" });
    const subPage = segments[3];
    crumbs.push({ label: COACH_SUB_LABELS[subPage] || subPage });
  } else {
    // Simple routes
    const firstSegment = segments[0];
    const label = ROUTE_LABELS[firstSegment];
    if (label) {
      crumbs.push({ label });
    } else {
      return null; // Unknown route — don't render breadcrumbs
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <div className="container mx-auto px-4 pt-3 pb-1">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
                <span className="sr-only">Home</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={i} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default AppBreadcrumb;
