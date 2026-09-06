import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth, safeDestination, registerSignOutCleanup } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
const m = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), signOut: vi.fn(), signInWithPassword: vi.fn(), updateUser: vi.fn(), invoke: vi.fn(), toast: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: m, functions: { invoke: m.invoke } } }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: m.toast }) }));
vi.mock('@/components/seo/Seo', () => ({ default: () => null }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
let event: (event: string, session: any) => void;
const session = (id: string, metadata = {}) => ({ access_token: 'test', user: { id, user_metadata: metadata } });
beforeEach(() => {
 vi.clearAllMocks();
 m.getSession.mockResolvedValue({ data: { session: null } });
 m.onAuthStateChange.mockImplementation(cb => { event = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
 m.signOut.mockResolvedValue({ error: null });
});
afterEach(cleanup);
function Draft() { const [draft, setDraft] = useState(''); return <input aria-label="draft" value={draft} onChange={e => setDraft(e.target.value)} />; }
it('remounts actual protected account children on A to B switch', async () => {
 m.getSession.mockResolvedValue({ data: { session: session('a') } });
 render(<MemoryRouter><AuthProvider><ProtectedRoute><Draft /></ProtectedRoute></AuthProvider></MemoryRouter>);
 fireEvent.change(await screen.findByLabelText('draft'), { target: { value: 'private A' } });
 act(() => event('SIGNED_IN', session('b')));
 expect(screen.getByLabelText('draft')).toHaveValue('');
});
it.each(['//evil.test','/\\evil.test','https://evil.test','/%2fevil.test','/%5cevil.test'])('rejects unsafe destination %s', value => expect(safeDestination(value)).toBe('/onboarding'));
it('preserves safe deep destination', () => expect(safeDestination('/report/abc?tab=x#section')).toBe('/report/abc?tab=x#section'));
it('actual login form settles rejected SDK promise', async () => {
 m.signInWithPassword.mockRejectedValue(new Error('offline'));
 render(<MemoryRouter><AuthProvider><Auth /></AuthProvider></MemoryRouter>);
 fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@example.test' } });
 fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
 fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);
 await waitFor(() => expect(m.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Authentication failed' })));
 expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
});
it('reconciles preserved invite only after session and exposes returned errors', async () => {
 m.invoke.mockResolvedValue({ error: new Error('expired invite') });
 render(<AuthProvider><div>content</div></AuthProvider>);
 await waitFor(() => expect(m.getSession).toHaveBeenCalled());
 expect(m.invoke).not.toHaveBeenCalled();
 act(() => event('SIGNED_IN', session('a', { invite_code: 'invite-123' })));
 expect(await screen.findByRole('alert')).toHaveTextContent('expired invite');
 expect(m.invoke).toHaveBeenCalledWith('process-coach-invite', expect.objectContaining({ body: { invite_code: 'invite-123' } }));
});
it('does not sign out when authenticated token cleanup fails', async () => {
 m.getSession.mockResolvedValue({ data: { session: session('a') } });
 let signOut!: () => Promise<void>;
 function Probe() { signOut = useAuth().signOut; return null; }
 const remove = registerSignOutCleanup(async () => { throw new Error('revoke failed'); });
 render(<AuthProvider><Probe /></AuthProvider>);
 await waitFor(() => expect(m.getSession).toHaveBeenCalled());
 await act(async () => {});
 await expect(signOut()).rejects.toThrow('revoke failed');
 expect(m.signOut).not.toHaveBeenCalled(); remove();
});
it('ordinary signed-in session cannot submit recovery form', async () => {
 m.getSession.mockResolvedValue({ data: { session: session('a') } });
 render(<MemoryRouter><AuthProvider><ResetPassword /></AuthProvider></MemoryRouter>);
 expect(screen.getByRole('button', { name: 'Update password' })).toBeDisabled();
 expect(screen.getByRole('alert')).toHaveTextContent('Recovery link');
 expect(m.updateUser).not.toHaveBeenCalled();
});
