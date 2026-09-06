import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useNativeDeepLinks, recoveryReadyFor, clearRecovery } from '@/hooks/useNativeDeepLinks';
const m = vi.hoisted(() => ({ navigate: vi.fn(), addListener: vi.fn(), getLaunchUrl: vi.fn(), exchangeCodeForSession: vi.fn(), setSession: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => m.navigate }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/app', () => ({ App: m }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: m } }));
beforeEach(() => { vi.clearAllMocks(); clearRecovery(); m.addListener.mockResolvedValue({ remove: vi.fn().mockResolvedValue(undefined) }); m.getLaunchUrl.mockResolvedValue(undefined); });
afterEach(cleanup);
it.each(['intentus://app/reset-password?code=pkce','intentus://app/reset-password#type=recovery&access_token=a&refresh_token=b'])('exchanges actual callback before recovery readiness: %s', async url => {
 m.exchangeCodeForSession.mockResolvedValue({ data: { session: { user: { id: 'a' } } }, error: null });
 m.setSession.mockResolvedValue({ data: { session: { user: { id: 'a' } } }, error: null });
 m.getLaunchUrl.mockResolvedValue({ url }); renderHook(useNativeDeepLinks);
 await waitFor(() => expect(m.navigate).toHaveBeenCalledWith('/reset-password', { replace: true }));
 expect(recoveryReadyFor('a')).toBe(true);
 expect(url.includes('code=') ? m.exchangeCodeForSession : m.setSession).toHaveBeenCalledOnce();
});
it('never exchanges credentials from unowned URLs', async () => {
 renderHook(useNativeDeepLinks); await waitFor(() => expect(m.addListener).toHaveBeenCalled());
 await act(async () => m.addListener.mock.calls[0][1]({ url: 'https://evil.test/reset-password?code=stolen' }));
 expect(m.exchangeCodeForSession).not.toHaveBeenCalled(); expect(m.navigate).not.toHaveBeenCalled();
});
