
-- Fix privilege escalation on coach_clients: only coaches can insert
DROP POLICY IF EXISTS "Coaches can insert clients" ON public.coach_clients;
CREATE POLICY "Coaches can insert clients"
ON public.coach_clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = coach_user_id AND public.is_coach(auth.uid()));

-- Add admin-only SELECT policy to revenuecat_events (writes remain service_role only)
CREATE POLICY "Admins can view revenuecat_events"
ON public.revenuecat_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
