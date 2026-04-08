import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface CheckIn {
  mood_score: number | null;
  energy_score: number | null;
  created_at: string;
}

const MoodEnergyChart = ({ checkIns }: { checkIns: CheckIn[] }) => {
  if (checkIns.length < 2) return null;

  const data = [...checkIns]
    .reverse()
    .map((c) => ({
      date: format(new Date(c.created_at), "MMM d"),
      Mood: c.mood_score ?? undefined,
      Energy: c.energy_score ?? undefined,
    }));

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-heading font-bold text-foreground mb-4">Mood vs Energy</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis domain={[1, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend />
          <Line type="monotone" dataKey="Mood" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Energy" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodEnergyChart;
