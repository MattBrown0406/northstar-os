import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), configure: vi.fn(), logIn: vi.fn(), setLogLevel: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, auth: { onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) } } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' } }));
vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: mocks, LOG_LEVEL: { DEBUG: 'debug', INFO: 'info' } }));
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); vi.stubEnv('VITE_REVENUECAT_IOS_API_KEY', 'test-public-key'); });
it('configures once and uses logIn for an account switch', async () => {
 const { configureRevenueCat } = await import('@/lib/revenuecat');
 await Promise.all([configureRevenueCat('a'), configureRevenueCat('a')]);
 await configureRevenueCat('b');
 expect(mocks.configure).toHaveBeenCalledTimes(1);
 expect(mocks.logIn).toHaveBeenCalledWith({ appUserID: 'b' });
});
it('never grants paid access from client customer info', async () => {
 const query = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data: { plan_tier: 'free' }, error: null }), update: vi.fn() };
 query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.update.mockReturnValue(query); mocks.from.mockReturnValue(query);
 const { syncSupabasePlanTierFromCustomerInfo } = await import('@/lib/revenuecat');
 const customer = { entitlements: { active: { coach: { isActive: true } } } };
 const tier = await syncSupabasePlanTierFromCustomerInfo('a', customer as never);
 expect(query.update).not.toHaveBeenCalled(); expect(tier).toBeNull();
});
