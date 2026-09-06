import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import InteractiveSample from "@/components/InteractiveSample";

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const choose = (name: string) => fireEvent.click(screen.getByRole("radio", { name }));
function complete(focus = "Work", barrier = "Too many priorities", time = "5 minutes") {
  choose(focus); click("Continue");
  choose(barrier); click("Continue");
  choose(time); click("See sample report");
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("InteractiveSample", () => {
  it("gates each of three questions and announces progress with focus", () => {
    render(<InteractiveSample />);
    expect(screen.getByRole("status")).toHaveTextContent("Question 1 of 3");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    choose("Work"); click("Continue");
    expect(screen.getByRole("heading", { name: "What is getting in the way?" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Question 2 of 3");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    choose("Low energy"); click("Continue");
    expect(screen.getByRole("status")).toHaveTextContent("Question 3 of 3");
    expect(screen.getByRole("button", { name: "See sample report" })).toBeDisabled();
    expect(screen.queryByRole("heading", { name: "Your SAMPLE report" })).not.toBeInTheDocument();
  });

  it("retains answers on Back and updates the report when an answer is edited", () => {
    render(<InteractiveSample />);
    choose("Work"); click("Continue"); choose("Too many priorities"); click("Continue");
    choose("15 minutes"); click("Back");
    expect(screen.getByRole("radio", { name: "Too many priorities" })).toBeChecked();
    click("Back"); expect(screen.getByRole("radio", { name: "Work" })).toBeChecked();
    choose("Relationships"); click("Continue"); click("Continue");
    expect(screen.getByRole("radio", { name: "15 minutes" })).toBeChecked();
    click("See sample report");
    expect(screen.getByText(/For relationships, set aside 15 minutes/)).toHaveTextContent("circle one");
    click("Edit answer 2"); choose("An unclear next step"); click("Continue"); click("See sample report");
    expect(screen.getByText(/For relationships, set aside 15 minutes/)).toHaveTextContent("smallest concrete step");
    expect(screen.queryByText(/circle one/)).not.toBeInTheDocument();
    click("Edit answer 3"); choose("30 minutes"); click("See sample report");
    expect(screen.getByText(/For relationships, set aside 30 minutes/)).toBeInTheDocument();
  });

  it.each(["Too many priorities", "An unclear next step", "Low energy"])("produces a deterministic, explicitly sample report for %s", (barrier) => {
    render(<InteractiveSample />);
    complete("Personal wellbeing", barrier, "30 minutes");
    expect(screen.getByRole("heading", { name: "Your SAMPLE report" })).toHaveFocus();
    expect(screen.getByText(/not a live assessment/)).toBeInTheDocument();
    expect(screen.getByText(/not AI analysis|not a diagnosis|not AI/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up for Intentus" })).toHaveAttribute("href", "/auth?mode=signup");
    const action = screen.getByText(/For personal wellbeing, set aside 30 minutes/).textContent;
    click("Reset sample"); complete("Personal wellbeing", barrier, "30 minutes");
    expect(screen.getByText(/For personal wellbeing, set aside 30 minutes/)).toHaveTextContent(action!);
  });

  it("resets every answer from completion and during a question", () => {
    render(<InteractiveSample />); complete(); click("Reset sample");
    expect(screen.getByRole("status")).toHaveTextContent("Question 1 of 3");
    expect(screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    choose("Work"); click("Continue");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    choose("Low energy"); click("Continue");
    expect(screen.getByRole("button", { name: "See sample report" })).toBeDisabled();
    click("Reset sample"); expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("does not request a network service or persist answers", () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const { unmount } = render(<InteractiveSample />); complete();
    expect(fetch).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
    unmount(); render(<InteractiveSample />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
