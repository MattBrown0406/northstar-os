import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useNativeDeepLinks, recoveryReadyFor, clearRecovery } from '@/hooks/useNativeDeepLinks';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), addListener: vi.fn(), getLaunchUrl: vi.fn().mockResolvedValue(undefined), setSession: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/app', () => ({ App: mocks }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mocks } }));
afterEach(() => { cleanup(); clearRecovery(); vi.clearAllMocks(); });
it('removes a listener that finishes registering after unmount', async () => {
 let resolve!: (v: { remove: () => Promise<void> }) => void;
 mocks.addListener.mockReturnValue(new Promise(r => { resolve = r; }));
 const remove = vi.fn().mockResolvedValue(undefined);
 const { unmount } = renderHook(useNativeDeepLinks);
 await waitFor(() => expect(mocks.addListener).toHaveBeenCalled());
 unmount(); await act(async () => resolve({ remove }));
 expect(remove).toHaveBeenCalledOnce();
});
it('consumes recovery credentials from cold launch before clean navigation', async () => {
 mocks.addListener.mockResolvedValue({ remove: vi.fn().mockResolvedValue(undefined) });
 mocks.getLaunchUrl.mockResolvedValue({ url: 'intentus://app/reset-password#type=recovery&access_token=test&refresh_token=refresh' });
 mocks.setSession.mockResolvedValue({ data: { session: { user: { id: 'recovery-user' } } }, error: null });
 renderHook(useNativeDeepLinks);
 await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/reset-password', { replace: true }));
 expect(mocks.setSession).toHaveBeenCalledWith({ access_token: 'test', refresh_token: 'refresh' });
 expect(recoveryReadyFor('recovery-user')).toBe(true);
});
it('rejects external route payloads', async () => {
 mocks.getLaunchUrl.mockResolvedValue(undefined);
 mocks.addListener.mockResolvedValue({ remove: vi.fn().mockResolvedValue(undefined) });
 renderHook(useNativeDeepLinks);
 await waitFor(() => expect(mocks.addListener).toHaveBeenCalled());
 await act(async () => mocks.addListener.mock.calls[0][1]({ url: 'intentus://app?route=https://evil.example' }));
 expect(mocks.navigate).not.toHaveBeenCalled();
});
