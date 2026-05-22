
-- Tighten write policies: require auth.uid() not null (signups disabled, so only admin authenticates)
DROP POLICY "Authenticated write posts" ON public.posts;
CREATE POLICY "Auth users insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users update posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users delete posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated write logs" ON public.logs;
CREATE POLICY "Auth users insert logs" ON public.logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users delete logs" ON public.logs FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated write settings" ON public.settings;
CREATE POLICY "Auth users update settings" ON public.settings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Lock down SECURITY DEFINER helpers (only the trigger / service role need them)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
