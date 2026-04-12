import { useEffect, useState } from "react";
import CoachBrandingSettings from "@/components/coach/CoachBrandingSettings";
import { useNavigate } from "react-router-dom";
import AppBreadcrumb from "@/components/AppBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { brandLogo as logo } from "@/lib/brand";
import {
  Compass, LogOut, Users, Link2, Plus, Copy, Trash2,
  Eye, FileText, BarChart3, CheckCircle, Clock,
  UserPlus, ChevronDown, ChevronUp, Activity, Crown

} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Client {
  id: string;
  client_user_id: string;
  assigned_tier: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    onboarding_completed: boolean | null;
    plan_tier: string | null;
  };
  audit_status?: string | null;
  has_report?: boolean;
  last_check_in?: string | null;
  check_in_count?: number;
}

interface InviteLink {
  id: string;
  invite_code: string;
  assigned_tier: string;
  label: string | null;
  is_active: boolean;
  uses_count: number;
  created_at: string;
}

const CoachDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvites, setShowInvites] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkTier, setNewLinkTier] = useState("free");
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [profileRes, clientsRes, linksRes] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("user_id", user.id).single(),
      supabase.from("coach_clients").select("*").eq("coach_user_id", user.id),
      supabase.from("coach_invite_links").select("*").eq("coach_user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data as any);
    if (linksRes.data) setInviteLinks(linksRes.data as any);

    if (clientsRes.data && clientsRes.data.length > 0) {
      const clientIds = clientsRes.data.map((c: any) => c.client_user_id);

      const [profilesRes, auditsRes, reportsRes, checkInsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, onboarding_completed, plan_tier").in("user_id", clientIds),
        supabase.from("baseline_audits").select("user_id, status").in("user_id", clientIds),
        supabase.from("strategic_reports").select("user_id").in("user_id", clientIds),
        supabase.from("check_ins").select("user_id, created_at").in("user_id", clientIds).order("created_at", { ascending: false }),
      ]);

      const enriched: Client[] = clientsRes.data.map((c: any) => {
        const prof = profilesRes.data?.find((p: any) => p.user_id === c.client_user_id);
        const audit = auditsRes.data?.find((a: any) => a.user_id === c.client_user_id);
        const hasReport = reportsRes.data?.some((r: any) => r.user_id === c.client_user_id);
        const clientCheckIns = checkInsRes.data?.filter((ci: any) => ci.user_id === c.client_user_id) ?? [];

        return {
          ...c,
          profile: prof ? { display_name: prof.display_name, onboarding_completed: prof.onboarding_completed, plan_tier: prof.plan_tier } : undefined,
          audit_status: audit?.status ?? null,
          has_report: hasReport ?? false,
          last_check_in: clientCheckIns[0]?.created_at ?? null,
          check_in_count: clientCheckIns.length,
        };
      });

      setClients(enriched);
    } else {
      setClients([]);
    }

    setLoading(false);
  };

  const createInviteLink = async () => {
    if (!user) return;
    const { error } = await supabase.from("coach_invite_links").insert({
      coach_user_id: user.id,
      assigned_tier: newLinkTier,
      label: newLinkLabel || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invite link created" });
      setNewLinkLabel("");
      loadData();
    }
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/auth?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Invite link copied to clipboard" });
  };

  const deleteLink = async (id: string) => {
    await supabase.from("coach_invite_links").delete().eq("id", id);
    loadData();
  };

  const updateClientTier = async (clientId: string, clientUserId: string, tier: string) => {
    await Promise.all([
      supabase.from("coach_clients").update({ assigned_tier: tier } as any).eq("id", clientId),
      supabase.from("profiles").update({ plan_tier: tier } as any).eq("user_id", clientUserId),
    ]);
    toast({ title: "Tier updated" });
    loadData();
  };

  const tierDistribution = [
    { name: "Free", value: clients.filter((client) => client.assigned_tier === "free").length },
    { name: "Pro", value: clients.filter((client) => client.assigned_tier === "pro").length },
    { name: "Premium", value: clients.filter((client) => client.assigned_tier === "premium").length },
  ];
  const activityData = clients
    .slice()
    .sort((a, b) => (b.check_in_count ?? 0) - (a.check_in_count ?? 0))
    .slice(0, 6)
    .map((client) => ({
      name: shortName(client.profile?.display_name || "Client"),
      checkIns: client.check_in_count ?? 0,
    }));
  const attentionClients = clients
    .filter((client) => !client.last_check_in || differenceInDays(new Date(), new Date(client.last_check_in)) >= 7)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Intentus" className="h-8 w-auto md:h-10" />
            <span className="font-heading text-base font-bold text-foreground sm:text-lg">Coach Dashboard</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="px-2 sm:px-3">
              <ArrowLeft className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">My Dashboard</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      <AppBreadcrumb />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Coach Portal{profile?.display_name ? ` — ${profile.display_name}` : ""}
          </h1>
          <p className="text-muted-foreground">Manage your clients, view their progress, and customize their plans.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-primary" /><span className="text-xs text-muted-foreground">Total Clients</span></div>
            <p className="font-heading text-2xl font-bold text-foreground">{clients.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><CheckCircle className="h-5 w-5 text-primary" /><span className="text-xs text-muted-foreground">Audits Done</span></div>
            <p className="font-heading text-2xl font-bold text-foreground">{clients.filter(c => c.audit_status === "completed").length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><FileText className="h-5 w-5 text-primary" /><span className="text-xs text-muted-foreground">Reports Generated</span></div>
            <p className="font-heading text-2xl font-bold text-foreground">{clients.filter(c => c.has_report).length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><Link2 className="h-5 w-5 text-accent" /><span className="text-xs text-muted-foreground">Active Links</span></div>
            <p className="font-heading text-2xl font-bold text-foreground">{inviteLinks.filter(l => l.is_active).length}</p>
          </div>
        </div>

        <div className="grid gap-6 mb-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Client activity snapshot
                </h2>
                <p className="text-sm text-muted-foreground">A quick-glance chart using real client check-in counts already loaded into the portal.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <BarChart3 className="h-3.5 w-3.5" /> Top active clients
              </div>
            </div>

            {activityData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={26} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--background))",
                      }}
                    />
                    <Bar dataKey="checkIns" name="Check-ins" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                Client activity charts will appear once clients begin checking in.
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-foreground">Tier mix</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">This mirrors the same scorecard language used in the homepage hero, but with live client assignments.</p>
            <div className="space-y-4 mb-5">
              {tierDistribution.map((tier) => {
                const total = Math.max(clients.length, 1);
                const width = `${(tier.value / total) * 100}%`;
                return (
                  <div key={tier.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{tier.name}</span>
                      <span className="text-muted-foreground">{tier.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-primary" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Needs attention</p>
              {attentionClients.length > 0 ? (
                <div className="space-y-3">
                  {attentionClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{client.profile?.display_name || "Unnamed Client"}</p>
                        <p className="text-muted-foreground">{client.last_check_in ? `Last check-in ${format(new Date(client.last_check_in), "MMM d")}` : "No check-ins yet"}</p>
                      </div>
                      <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">Follow up</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No clients are currently stale based on the loaded check-in history.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <button
            onClick={() => setShowInvites(!showInvites)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Invite Links
            </h2>
            {showInvites ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </button>

          {showInvites && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-xl">
                <div className="flex-1">
                  <Label className="text-xs">Label (optional)</Label>
                  <Input
                    placeholder="e.g. Workshop Group A"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                  />
                </div>
                <div className="w-40">
                  <Label className="text-xs">Client Tier</Label>
                  <Select value={newLinkTier} onValueChange={setNewLinkTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={createInviteLink} variant="hero" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Create Link
                  </Button>
                </div>
              </div>

              {inviteLinks.length > 0 ? (
                <div className="space-y-2">
                  {inviteLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl text-sm">
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{link.label || "Unnamed link"}</span>
                        <span className="text-muted-foreground ml-2">• {link.assigned_tier} tier • {link.uses_count} uses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${link.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {link.is_active ? "Active" : "Inactive"}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => copyLink(link.invite_code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteLink(link.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No invite links yet. Create one to start onboarding clients.</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Your Clients
          </h2>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-heading font-bold text-foreground mb-1">No clients yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create an invite link and share it with your clients to get started.</p>
              <Button variant="hero" size="sm" onClick={() => setShowInvites(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Create Invite Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-bold text-foreground">
                        {client.profile?.display_name || "Unnamed Client"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Joined {format(new Date(client.created_at), "MMM d, yyyy")}
                        {client.last_check_in && ` • Last check-in ${format(new Date(client.last_check_in), "MMM d")}`}
                        {` • ${client.check_in_count ?? 0} check-ins`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={client.assigned_tier}
                        onValueChange={(tier) => updateClientTier(client.id, client.client_user_id, tier)}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      client.profile?.onboarding_completed
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}>
                      {client.profile?.onboarding_completed ? "Onboarded" : "Pending onboarding"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      client.audit_status === "completed"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {client.audit_status === "completed" ? "Audit complete" : "No audit"}
                    </span>
                    {client.has_report && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Report ready</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {client.audit_status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/coach/client/${client.client_user_id}/audit`)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View Audit
                      </Button>
                    )}
                    {client.has_report && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/coach/client/${client.client_user_id}/report`)}
                      >
                        <FileText className="h-3 w-3 mr-1" /> View / Edit Plan
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/coach/client/${client.client_user_id}/check-ins`)}
                    >
                      <BarChart3 className="h-3 w-3 mr-1" /> Check-ins
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branding Settings */}
        <div className="mt-8">
          <CoachBrandingSettings />
        </div>
      </div>
    </div>
  );
};

function shortName(name: string) {
  return name.length > 14 ? `${name.slice(0, 14)}…` : name;
}

export default CoachDashboard;
