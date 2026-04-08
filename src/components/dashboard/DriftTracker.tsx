import { AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface CheckIn {
  id: string;
  drift_detected: boolean | null;
  created_at: string;
  blockers: string[] | null;
}

const DriftTracker = ({ checkIns }: { checkIns: CheckIn[] }) => {
  const recent = checkIns.slice(0, 7);
  if (recent.length === 0) return null;

  const driftDays = recent.filter(c => c.drift_detected);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-accent" /> Drift Tracker
      </h3>
      <div className="flex gap-1 mb-4">
        {recent.map((c) => (
          <div
            key={c.id}
            title={format(new Date(c.created_at), "MMM d")}
            className={`flex-1 h-8 rounded-md flex items-center justify-center ${
              c.drift_detected
                ? "bg-accent/20 border border-accent/40"
                : "bg-primary/10 border border-primary/20"
            }`}
          >
            {c.drift_detected ? (
              <AlertTriangle className="h-3 w-3 text-accent" />
            ) : (
              <CheckCircle className="h-3 w-3 text-primary" />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {driftDays.length === 0
          ? "No drift detected this week. You're operating with intent."
          : `Drift flagged on ${driftDays.length} of ${recent.length} check-ins. Stay deliberate.`}
      </p>
    </div>
  );
};

export default DriftTracker;
