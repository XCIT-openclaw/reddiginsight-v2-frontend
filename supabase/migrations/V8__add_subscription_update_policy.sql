-- V8: Allow authenticated users to update their own subscription row.
-- Required by the frontend API for upgrade, downgrade, cancel, pause and resume actions.
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

CREATE POLICY "Users can update own subscription"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
