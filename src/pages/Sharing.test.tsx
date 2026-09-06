import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
const { load, save } = vi.hoisted(() => ({load:vi.fn(),save:vi.fn()}));
vi.mock("@/contexts/AuthContext", () => ({useAuth: () => ({user:{id:"owner"}}), bounded:(p:unknown)=>p}));
vi.mock("@/integrations/supabase/client", () => ({supabase:{rpc:vi.fn(),from:()=>({select:()=>({eq:()=>({eq:()=>({order:()=>({limit:()=>Promise.resolve({data:[],error:null})})})})})})}}));
vi.mock("@/lib/coach-sharing", async importOriginal => ({...await importOriginal<object>(),loadCoachSharing:load,saveCoachSharing:save}));
import Sharing from "./Sharing";
beforeEach(() => {load.mockReset(); save.mockReset();});
afterEach(cleanup);
it("requires acknowledgement and does not claim private after failed save", async () => {
 load.mockResolvedValue({enabled:true,legacy:true,coaches:[{id:"coach",name:"Taylor",eligible:true}]}); save.mockRejectedValue(new Error("offline"));
 render(<MemoryRouter><Sharing /></MemoryRouter>);
 await screen.findByText(/Taylor/);
 const button = screen.getByRole("button",{name:"Save sharing preference"}); expect(button).toBeDisabled();
 fireEvent.click(screen.getByRole("switch"));
 fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(button);
 await screen.findByRole("alert");
 expect(screen.getByText(/Current access is unknown/)).toBeInTheDocument();
 expect(screen.queryByText("Human-coach sharing is off.")).not.toBeInTheDocument();
});
it("load failure is unknown, not no linked coaches", async () => {
 load.mockRejectedValue(new Error("offline")); render(<MemoryRouter><Sharing /></MemoryRouter>);
 await waitFor(()=>expect(screen.getByRole("alert")).toHaveTextContent("Access status is unknown"));
 expect(screen.queryByText("No human coach is linked to your account.")).not.toBeInTheDocument();
});
