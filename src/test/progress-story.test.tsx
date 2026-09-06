import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import ProgressStory from "@/components/dashboard/ProgressStory";
import { buildProgressStory, fetchProgressStory, type ProgressStoryData } from "@/lib/progress-story";
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));
const empty: ProgressStoryData = { history: [], latest: null, commitments: [], checkIns: [] };
function queries(result: unknown) {
  const q = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), gte: vi.fn(), then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject) };
  for (const key of ["select", "eq", "order", "limit", "gte"] as const) q[key].mockReturnValue(q);
  return q;
}
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe("progress story", () => {
  it("handles empty, null and sparse historical reports without inventing a baseline", () => {
    expect(buildProgressStory(empty).insufficientBaseline).toBe(true);
    expect(buildProgressStory({ ...empty, history: [{ report_data: null }, { report_data: [], completed_at: "invalid" }], latest: { created_at: "2026-09-01", north_star_focus: "Sleep" } }).focus).toBe("Sleep");
    expect(buildProgressStory({ ...empty, history: [{ completed_at: "2026-01-01", report_data: {} }], latest: { created_at: "2026-09-01", forced_choice: "Focus" } }).changes).toEqual([]);
  });
  it("orders real snapshots, compares only shared fields, and does not mutate input", () => {
    const history = [{ completed_at: "2026-08-01", report_data: { north_star_focus: "Rest" } }, { completed_at: "2026-01-01", report_data: { north_star_focus: "Work" } }];
    const story = buildProgressStory({ ...empty, history, latest: { created_at: "2026-09-01", north_star_focus: "Family", forced_choice: "Decide" } });
    expect(story.changes).toEqual([{ label: "Operating focus", before: "Rest", after: "Family", changed: true }]);
    expect(history[0].completed_at).toBe("2026-08-01");
  });
  it("keeps partial and unknown outcomes separate rather than manufacturing a score", () => {
    const story = buildProgressStory({ ...empty, commitments: ["yes", "partially", "no", null, "unknown"].map(outcome => ({ week_start: "2026-08-31", outcome })), checkIns: [{ created_at: "2026-09-01", mood_score: null }] });
    expect(story.counts).toEqual({ completed: 1, partial: 1, notCompleted: 1, unreported: 2 });
    expect(story.checkInCount).toBe(1);
    expect(story.adjustment).toContain("smaller");
  });
  it("rejects returned errors instead of presenting fake empty progress", async () => {
    const q = queries({ data: null, error: { message: "denied" } }); from.mockReturnValue(q);
    await expect(fetchProgressStory("owner")).rejects.toThrow("Could not load audit history");
    expect(q.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("renders errors and successfully retries", async () => {
    from.mockImplementation(() => queries({ data: null, error: { message: "offline" } }));
    render(<ProgressStory userId="a" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load");
    from.mockImplementation(() => queries({ data: [], error: null }));
    fireEvent.click(screen.getByRole("button", { name: "Retry progress" }));
    await waitFor(() => expect(screen.getByText(/Not enough comparable/)).toBeInTheDocument());
  });
  it("fences delayed old-account responses", async () => {
    let resolve!: (v: unknown) => void;
    const pending = new Promise(r => { resolve = r; });
    from.mockImplementation(() => queries(pending));
    const view = render(<ProgressStory userId="old" />);
    from.mockImplementation(() => queries({ data: [], error: null }));
    view.rerender(<ProgressStory userId="new" />);
    await screen.findByText(/Not enough comparable/);
    await act(async () => resolve({ data: [{ created_at: "2026-09-01", north_star_focus: "OLD PRIVATE FOCUS" }], error: null }));
    expect(screen.queryByText(/OLD PRIVATE FOCUS/)).not.toBeInTheDocument();
  });
});
