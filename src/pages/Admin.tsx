import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBreadcrumb from "@/components/AppBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, ArrowLeft, Users, UserX, Crown,
  ClipboardCheck, FileText, MessageSquare, Calendar,
  Shield
} from "lucide-react";
import { brandLogo as logo } from "@/lib/brand";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  plan_tier: string | null;
  is_active: boolean;
  onboarding_completed: boolean | null;
  coaching_tone: string | null;
  check_in_cadence: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  audit_count?: number;
  checkin_count?: number;
  report_count?: number;
  last_checkin?: string | null;
  is_coach?: boolean;
  client_count?: number;
}

const Admin = () => {
  const { signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, closed: 0, coaches: 0 });

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchUsers();
  }, [isAdmin, adminLoading]);

  const fetchUsers = async () => {
    setLoading(true);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    // Fetch audit counts
    const { data: audits } = await supabase
      .from("baseline_audits")
      .select("user_id, status");

    // Fetch checkin counts
    const { data: checkins } = await supabase
      .from("check_ins")
      .select("user_id, created_at");

    // Fetch report counts
    const { data: reports } = await supabase
      .from("strategic_reports")
      .select("user_id");

    // Fetch coach clients
    const { data: coachClients } = await supabase
      .from("coach_clients")
      .select("coach_user_id, client_user_id");

    const enriched: UserProfile[] = profiles.map((p) => {
      const userAudits = audits?.filter(a => a.user_id === p.user_id) || [];
      const userCheckins = checkins?.filter(c => c.user_id === p.user_id) || [];
      const userReports = reports?.filter(r => r.user_id === p.user_id) || [];
      const coachClientsCount = coachClients?.filter(c => c.coach_user_id === p.user_id).length || 0;
      const lastCheckin = userCheckins.length > 0
        ? userCheckins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
        : null;

      return {
        ...p,
        audit_count: userAudits.length,
        checkin_count: userCheckins.length,
        report_count: userReports.length,
        last_checkin: lastCheckin,
        is_coach: p.plan_tier === "coach",
        client_count: coachClientsCount,
      };
    });

    const active = enriched.filter(u => u.is_active && u.plan_tier !== "coach");
    const closed = enriched.filter(u => !u.is_active);
    const coaches = enriched.filter(u => u.plan_tier === "coach");

    setStats({
      total: enriched.length,
      active: active.length,
      closed: closed.length,
      coaches: coaches.length,
    });

    setUsers(enriched);
    setLoading(false);
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_active: !currentActive })
      .eq("user_id", userId);
    fetchUsers();
  };

  if (adminLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading admin dashboard…</div>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.is_active && u.plan_tier !== "coach");
  const closedUsers = users.filter(u => !u.is_active);
  const coachUsers = users.filter(u => u.plan_tier === "coach");

  const tierColor = (tier: string | null) => {
    switch (tier) {
      case "premium": return "bg-gold/20 text-gold-dark border-gold/30";
      case "pro": return "bg-primary/20 text-primary border-primary/30";
      case "coach": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const UserRow = ({ user }: { user: UserProfile }) => (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">{user.display_name || "—"}</span>
          <Badge variant="outline" className={`text-xs ${tierColor(user.plan_tier)}`}>
            {user.plan_tier || "free"}
          </Badge>
          {!user.is_active && (
            <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
              Closed
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Joined {new Date(user.created_at).toLocaleDateString()}
          {user.onboarding_completed ? " · Onboarded" : " · Not onboarded"}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1" title="Audits">
          <ClipboardCheck className="h-3.5 w-3.5" />
          <span>{user.audit_count}</span>
        </div>
        <div className="flex items-center gap-1" title="Reports">
          <FileText className="h-3.5 w-3.5" />
          <span>{user.report_count}</span>
        </div>
        <div className="flex items-center gap-1" title="Check-ins">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{user.checkin_count}</span>
        </div>
        <div className="flex items-center gap-1" title="Last check-in">
          <Calendar className="h-3.5 w-3.5" />
          <span>{user.last_checkin ? new Date(user.last_checkin).toLocaleDateString() : "—"}</span>
        </div>
        {user.is_coach && (
          <div className="flex items-center gap-1" title="Clients">
            <Users className="h-3.5 w-3.5" />
            <span>{user.client_count} clients</span>
          </div>
        )}
      </div>

      <div className="ml-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => toggleActive(user.user_id, user.is_active)}
        >
          {user.is_active ? "Deactivate" : "Reactivate"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Intentus" className="h-8 w-auto sm:h-10" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold" />
              <span className="font-heading text-sm font-semibold text-muted-foreground">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="px-2 sm:px-3">
              <ArrowLeft className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">My Dashboard</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/coach")} className="px-2 sm:px-3">
              <Crown className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Coach</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <AppBreadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.total, icon: Users },
            { label: "Active", value: stats.active, icon: Users },
            { label: "Closed", value: stats.closed, icon: UserX },
            { label: "Coaches", value: stats.coaches, icon: Crown },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
              <div className="font-heading text-2xl font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeUsers.length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Closed ({closedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="coaches">
              Coaches ({coachUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-2">
            {activeUsers.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No active users</div>
            ) : (
              activeUsers.map(u => <UserRow key={u.user_id} user={u} />)
            )}
          </TabsContent>

          <TabsContent value="closed" className="space-y-2">
            {closedUsers.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No closed accounts</div>
            ) : (
              closedUsers.map(u => <UserRow key={u.user_id} user={u} />)
            )}
          </TabsContent>

          <TabsContent value="coaches" className="space-y-2">
            {coachUsers.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No coaching accounts</div>
            ) : (
              coachUsers.map(u => <UserRow key={u.user_id} user={u} />)
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
