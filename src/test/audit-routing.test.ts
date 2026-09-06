import { describe, expect, it, vi } from "vitest";
import { loadRoute } from "@/routing/loadRoute";
function browser() {
  return { sessionStorage: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), key: vi.fn(), length: 0 }, location: { reload: vi.fn() } } as unknown as Pick<Window, "sessionStorage" | "location">;
}
describe("route loading with restricted browser storage", () => {
  it("does not turn a successful import into a crash when cleanup fails", async () => {
    const b = browser(); vi.mocked(b.sessionStorage.removeItem).mockImplementation(() => { throw new Error("blocked"); });
    const page = { default: "loaded" };
    expect(await loadRoute(async () => page, "page", b)).toBe(page);
    expect(b.location.reload).not.toHaveBeenCalled();
  });
  it("preserves the original import error and never reloads without a durable marker", async () => {
    for (const method of ["getItem", "setItem"] as const) {
      const b = browser(); vi.mocked(b.sessionStorage[method]).mockImplementation(() => { throw new Error("blocked"); });
      const error = new Error("chunk unavailable");
      await expect(loadRoute(async () => { throw error; }, "page", b)).rejects.toBe(error);
      expect(b.location.reload).not.toHaveBeenCalled();
    }
  });
  it("does not reload repeatedly after an unsuccessful retry", async () => {
    const b = browser(); vi.mocked(b.sessionStorage.getItem).mockReturnValue("true");
    await expect(loadRoute(async () => { throw new Error("offline"); }, "page", b)).rejects.toThrow("offline");
    expect(b.location.reload).not.toHaveBeenCalled();
  });
  it("clears a previous retry after loading", async () => {
    const b = browser(); await loadRoute(async () => "ok", "page", b);
    expect(b.sessionStorage.removeItem).toHaveBeenCalledWith("route-retry:page");
  });
});
