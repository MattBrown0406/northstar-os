import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { TrendingDown, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CoachAnnotations } from './CoachAnnotations';

type Props = {
  client: {
    user_id: string;
    profile: { display_name: string };
    last_check_in: string | null;
    check_in_count: number;
  };
  coachId: string;
};

type CheckIn = {
  mood_score: number | null;
  energy_score: number | null;
  drift_detected: boolean | null;
  created_at: string;
  blockers: string[] | null;
};

type StrategicReport = {
  north_star_focus: string | null;
  forced_choice: string | null;
};

const moodColor = (score: number | null): string => {
  if (score === null) return 'bg-muted';
  if (score >= 7) return 'bg-emerald-500';
  if (score >= 4) return 'bg-amber-400';
  return 'bg-destructive';
};

const recurringBlockers = (checkIns: CheckIn[]): string[] => {
  const counts: Record<string, number> = {};
  for (const ci of checkIns) {
    if (Array.isArray(ci.blockers)) {
      for (const b of ci.blockers) {
        if (b) counts[b] = (counts[b] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([blocker]) => blocker);
};

export const CoachSessionPrep = ({ client, coachId }: Props) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [report, setReport] = useState<StrategicReport | null>(null);
  const [prepCount, setPrepCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const loadData = useCallback(async () => {
    // Load last 3 check-ins
    const { data: ciData } = await supabase
      .from('check_ins')
      .select('mood_score, energy_score, drift_detected, created_at, blockers')
      .eq('user_id', client.user_id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (ciData) setCheckIns(ciData as CheckIn[]);

    // Load latest strategic report
    const { data: reportData } = await supabase
      .from('strategic_reports')
      .select('north_star_focus, forced_choice')
      .eq('user_id', client.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportData) setReport(reportData as StrategicReport);

    // Count unresolved session_prep annotations
    const { count } = await supabase
      .from('coach_annotations')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .eq('client_user_id', client.user_id)
      .eq('annotation_type', 'session_prep')
      .eq('resolved', false);

    setPrepCount(count ?? 0);
  }, [client.user_id, coachId]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const hasDrift = checkIns.some((ci) => ci.drift_detected);
  const repeatedBlockers = recurringBlockers(checkIns);
  const northStarText = report?.north_star_focus
    ? report.north_star_focus.length > 120
      ? report.north_star_focus.slice(0, 120) + '…'
      : report.north_star_focus
    : null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold leading-snug">
              {client.profile.display_name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {client.check_in_count} check-in{client.check_in_count !== 1 ? 's' : ''}
              </Badge>
              {client.last_check_in && (
                <span className="text-xs text-muted-foreground">
                  Last: {format(new Date(client.last_check_in), 'MMM d')}
                </span>
              )}
            </div>
          </div>

          {/* Session prep notes badge */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-yellow-500 hover:text-yellow-400 transition-colors"
          >
            <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2.5 py-0.5">
              {prepCount > 0 ? (
                <>
                  {prepCount} prep note{prepCount !== 1 ? 's' : ''}
                </>
              ) : (
                'Session prep'
              )}
            </span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* North star focus */}
        {northStarText && (
          <p className="text-sm italic text-muted-foreground leading-relaxed">
            "{northStarText}"
          </p>
        )}

        {/* Last 3 mood/energy dots */}
        {checkIns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recent mood / energy
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {checkIns.map((ci, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${moodColor(ci.mood_score)}`}
                    title={`Mood: ${ci.mood_score ?? '?'}`}
                  />
                  <span className="text-xs text-foreground">
                    {ci.mood_score ?? '—'} / {ci.energy_score ?? '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(ci.created_at), 'M/d')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drift warning */}
        {hasDrift && (
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              Drift detected
            </Badge>
          </div>
        )}

        {/* Recurring blockers */}
        {repeatedBlockers.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-500 uppercase tracking-wide">
              Recurring blockers
            </p>
            <ul className="space-y-0.5">
              {repeatedBlockers.map((b, i) => (
                <li key={i} className="text-sm text-amber-500/80 flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expandable CoachAnnotations */}
        {expanded && (
          <div className="pt-2 border-t border-border">
            <CoachAnnotations
              clientUserId={client.user_id}
              coachId={coachId}
              defaultType="session_prep"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
