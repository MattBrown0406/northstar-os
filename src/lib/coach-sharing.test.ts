import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({rpc: vi.fn()}));
vi.mock("@/integrations/supabase/client", () => ({supabase: {rpc}}));
vi.mock("@/contexts/AuthContext", () => ({bounded: (p: unknown) => p}));
import { loadCoachSharing, saveCoachSharing, sharingStatus } from "./coach-sharing";
const state = {enabled:true, legacy:true, coaches:[]};
describe("coach sharing", () => {
 beforeEach(() => rpc.mockReset());
 it("does not imply access without an eligible link", () => expect(sharingStatus(state)).toContain("No eligible linked"));
 it("rejects missing acknowledgement without a write", async () => {await expect(saveCoachSharing(false,false)).rejects.toThrow(); expect(rpc).not.toHaveBeenCalled();});
 it("does not interpret load failures as private", async () => {rpc.mockResolvedValue({data:null,error:{message:"offline"}}); await expect(loadCoachSharing()).rejects.toThrow("offline");});
 it("verifies saved state and never sends a victim identifier", async () => {rpc.mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:{...state,enabled:false,legacy:false},error:null}); expect((await saveCoachSharing(false,true)).enabled).toBe(false); expect(rpc).toHaveBeenNthCalledWith(1,"set_coach_sharing",{p_enabled:false,p_acknowledged:true});});
 it("rejects a mismatched readback", async () => {rpc.mockResolvedValueOnce({data:null,error:null}).mockResolvedValueOnce({data:state,error:null}); await expect(saveCoachSharing(false,true)).rejects.toThrow("could not be confirmed");});
 it("rejects malformed server status", async () => {rpc.mockResolvedValue({data:{enabled:false},error:null}); await expect(loadCoachSharing()).rejects.toThrow();});
});
