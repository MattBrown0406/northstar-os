import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mocks, from: mocks.from } }));
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };
let event: (name: string, session: unknown) => void;
const session = (id: string) => ({ user: { id } });
beforeEach(() => {
 vi.clearAllMocks();
 mocks.onAuthStateChange.mockImplementation(cb => { event = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
 mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(cleanup);
describe('auth lifecycle', () => {
 it('does not resurrect a stored session after sign out', async () => {
  const restore = deferred<{ data: { session: unknown } }>(); mocks.getSession.mockReturnValue(restore.promise);
  const { result } = renderHook(useAuth, { wrapper: AuthProvider });
  act(() => event('SIGNED_OUT', null));
  await act(async () => restore.resolve({ data: { session: session('old') } }));
  expect(result.current.user).toBeNull(); expect(result.current.loading).toBe(false);
 });
 it('settles rejected restoration without an unhandled rejection', async () => {
  mocks.getSession.mockRejectedValue(new Error('offline'));
  const { result } = renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.user).toBeNull();
 });
 it('surfaces returned sign-out failures', async () => {
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  mocks.signOut.mockResolvedValue({ error: new Error('offline') });
  const { result } = renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.loading).toBe(false));
  await expect(result.current.signOut()).rejects.toThrow('offline');
 });
 it('fences an admin response after an account switch', async () => {
  mocks.getSession.mockResolvedValue({ data: { session: session('a') } });
  const a = deferred<{ data: unknown }>(); const b = deferred<{ data: unknown }>();
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); mocks.from.mockReturnValue(query);
  const { result } = renderHook(useAdminCheck, { wrapper: AuthProvider });
  await waitFor(() => expect(query.maybeSingle).toHaveBeenCalledTimes(1));
  act(() => event('SIGNED_IN', session('b')));
  await act(async () => b.resolve({ data: null }));
  await act(async () => a.resolve({ data: { role: 'admin' } }));
  expect(result.current.isAdmin).toBe(false);
 });
});
