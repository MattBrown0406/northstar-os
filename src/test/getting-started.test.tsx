import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getGettingStarted, type GettingStartedData } from "@/lib/getting-started";
import GettingStarted from "@/components/dashboard/GettingStarted";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: (table: string) => {
  let user = "";
  const builder = {
    select: () => builder, order: () => builder, limit: () => builder,
    eq: (key: string, value: string) => { if (key === "user_id") user = value; return builder; },
    then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(query(table, user)).then(resolve, reject),
  };
  return builder;
} } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const now = new Date("2026-09-09T12:00:00");
const empty = (): GettingStartedData => ({ audits: [], reports: [], goals: [], commitments: [], checkIns: [] });
const full = (): GettingStartedData => ({ audits: [{ id: "a", status: "completed" }], reports: [{ id: "r" }], goals: [{ title: "Build a team", is_active: true }], commitments: [{ week_start: "2026-09-07", commitment: "Interview a candidate" }], checkIns: [{ created_at: "2026-09-08T12:00:00" }] });

describe("persisted progress decisions", () => {
  it("prioritizes audit, report, goals, commitment, then check-in", () => {
    const data = empty();
    expect(getGettingStarted(data, now).next.id).toBe("audit");
    data.audits = full().audits;
    expect(getGettingStarted(data, now).next.route).toBe("/report");
    data.reports = full().reports;
    expect(getGettingStarted(data, now).next.id).toBe("goals");
    data.goals = full().goals;
    expect(getGettingStarted(data, now).next).toMatchObject({ id: "commitment", route: "/check-in" });
    data.commitments = full().commitments;
    expect(getGettingStarted(data, now).next.id).toBe("checkin");
  });
  it("does not count in-progress audits or inactive goals", () => {
    const data = full(); data.audits[0].status = "in_progress"; data.goals[0].is_active = false;
    expect(getGettingStarted(data, now).steps.filter(s => !s.complete).map(s => s.id)).toEqual(["audit", "goals"]);
  });
  it("keeps first-cycle history complete while prioritizing the new week", () => {
    const data = full(); data.commitments[0].week_start = "2026-08-31";
    expect(getGettingStarted(data, now)).toMatchObject({ complete: true, next: { id: "weekly-commitment" } });
    data.commitments = full().commitments; data.checkIns[0].created_at = "2026-09-06T12:00:00";
    expect(getGettingStarted(data, now).next.id).toBe("weekly-checkin");
    expect(getGettingStarted(full(), now).next.id).toBe("weekly-review");
  });
});

it("renders real persisted progress and account-scopes all five queries", async () => {
  query.mockResolvedValue({ data: [], error: null });
  render(<MemoryRouter><GettingStarted userId="alice" /></MemoryRouter>);
  expect(await screen.findByText("Your next best action")).toBeInTheDocument();
  expect(screen.getByText(/0\/5 saved milestones/)).toBeInTheDocument();
  expect(query).toHaveBeenCalledTimes(5);
  expect(query.mock.calls.every(([, user]) => user === "alice")).toBe(true);
});

it("fails closed on query error and supports retry", async () => {
  query.mockImplementation((table: string) => ({ data: [], error: table === "check_ins" ? { message: "denied" } : null }));
  render(<MemoryRouter><GettingStarted userId="alice" /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t load");
  expect(screen.queryByText(/saved milestones/)).not.toBeInTheDocument();
  query.mockResolvedValue({ data: [], error: null });
  fireEvent.click(screen.getByRole("button", { name: "Retry progress" }));
  expect(await screen.findByText(/0\/5 saved milestones/)).toBeInTheDocument();
});

it("fences delayed results across account changes", async () => {
  let resolve!: (result: unknown) => void;
  const pending = new Promise(r => { resolve = r; });
  query.mockImplementation((_table: string, user: string) => user === "alice" ? pending : { data: [], error: null });
  const view = render(<MemoryRouter><GettingStarted userId="alice" /></MemoryRouter>);
  await act(async () => { await Promise.resolve(); });
  view.rerender(<MemoryRouter><GettingStarted userId="bob" /></MemoryRouter>);
  expect(await screen.findByText(/0\/5 saved milestones/)).toBeInTheDocument();
  await act(async () => { resolve({ data: [{ id: "private", title: "Alice secret", is_active: true, status: "completed" }], error: null }); });
  expect(screen.queryByText(/Alice secret/)).not.toBeInTheDocument();
  expect(screen.getByText(/0\/5 saved milestones/)).toBeInTheDocument();
});
