import { useEffect, useRef, useState } from "react";
import { buildProgressStory, fetchProgressStory, type ProgressStoryData } from "@/lib/progress-story";
import { Button } from "@/components/ui/button";

export default function ProgressStory({ userId }: { userId: string }) {
  const generation = useRef(0);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ owner: string; data?: ProgressStoryData; error?: string }>({ owner: userId });
  useEffect(() => {
    const request = ++generation.current;
    let cancelled = false;
    setState({ owner: userId });
    fetchProgressStory(userId).then(data => {
      if (!cancelled && request === generation.current) setState({ owner: userId, data });
    }).catch(error => {
      if (!cancelled && request === generation.current) setState({ owner: userId, error: error instanceof Error ? error.message : "Could not load progress. Please retry." });
    });
    return () => { cancelled = true; };
  }, [userId, retry]);
  const visible = state.owner === userId ? state : null;
  const story = visible?.data ? buildProgressStory(visible.data) : null;
  return (
    <section aria-label="Your progress story" className="rounded-2xl border border-border/70 bg-card/90 p-5 space-y-4">
      <div><h2 className="font-heading font-bold">Your progress story</h2><p className="text-sm text-muted-foreground">Saved direction and recent follow-through</p></div>
      {visible?.error ? <div role="alert"><p>{visible.error}</p><Button variant="outline" className="mt-2" onClick={() => setRetry(n => n + 1)}>Retry progress</Button></div>
        : !story ? <p role="status" className="text-sm text-muted-foreground">Loading your progress…</p>
        : <>
          <div><h3 className="text-sm font-semibold">Follow-through · last 8 weeks</h3>
            <p className="text-sm mt-1">{story.counts.completed} completed · {story.counts.partial} partial · {story.counts.notCompleted} not completed · {story.counts.unreported} without a recorded outcome</p>
            <p className="text-xs text-muted-foreground mt-1">{story.checkInCount} saved check-ins. Outcomes are self-reported; an unreported outcome is not a failure.</p>
          </div>
          <div><h3 className="text-sm font-semibold">What changed</h3>
            {story.insufficientBaseline ? <p className="text-sm text-muted-foreground mt-1">Not enough comparable report history yet. Complete an audit, then a later re-audit to compare your saved focus and key tradeoff. Missing fields are not treated as improvements.</p>
              : <><p className="text-xs text-muted-foreground mt-1">{new Date(story.from!).toLocaleDateString()} → {new Date(story.to!).toLocaleDateString()}</p>
                <ul className="space-y-3 mt-2">{story.changes.map(change => <li key={change.label} className="text-sm break-words"><span className="font-medium">{change.label}: {change.changed ? "updated" : "unchanged"}</span>{change.changed && <p className="text-muted-foreground">Before: {change.before}</p>}<p>Now: {change.after}</p></li>)}</ul></>}
            {story.insufficientBaseline && story.focus && <p className="text-sm mt-2 break-words">Latest saved focus: {story.focus}</p>}
          </div>
          <div className="border-t border-border/60 pt-3"><h3 className="text-sm font-semibold">One adjustment to try</h3><p className="text-sm mt-1">{story.adjustment}</p></div>
          <p className="text-xs text-muted-foreground">Report wording reflects saved coaching guidance, not an objective improvement score. These records do not show that commitments caused report changes.</p>
        </>}
    </section>
  );
}
