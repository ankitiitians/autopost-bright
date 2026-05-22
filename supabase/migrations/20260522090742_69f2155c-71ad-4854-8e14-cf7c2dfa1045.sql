
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- POSTS (history)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin','instagram')),
  status TEXT NOT NULL CHECK (status IN ('success','failed','pending')),
  content TEXT NOT NULL,
  image_url TEXT,
  image_prompt TEXT,
  external_id TEXT,
  error_msg TEXT,
  run_id UUID,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_posts_posted_at ON public.posts (posted_at DESC);
CREATE POLICY "Authenticated read posts" ON public.posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write posts" ON public.posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- LOGS
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('INFO','SUCCESS','ERROR','WARNING')),
  message TEXT NOT NULL,
  run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_logs_created_at ON public.logs (created_at DESC);
CREATE POLICY "Authenticated read logs" ON public.logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write logs" ON public.logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SETTINGS (singleton)
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_name TEXT NOT NULL DEFAULT 'AutoPost AI',
  schedule_enabled BOOLEAN NOT NULL DEFAULT true,
  post_time TEXT NOT NULL DEFAULT '09:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  active_days TEXT[] NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  default_category TEXT NOT NULL DEFAULT 'DevOps',
  default_tone TEXT NOT NULL DEFAULT 'Educational',
  default_image_style TEXT NOT NULL DEFAULT 'Corporate Blue',
  post_to_linkedin BOOLEAN NOT NULL DEFAULT true,
  post_to_instagram BOOLEAN NOT NULL DEFAULT true,
  notification_email TEXT,
  linkedin_prompt TEXT NOT NULL DEFAULT 'Write a professional LinkedIn post about {topic}.
Tone: {tone}.
No emojis.
Use professional formatting with line breaks.
End with 3-5 relevant hashtags.
Maximum 1300 characters.',
  instagram_prompt TEXT NOT NULL DEFAULT 'Write an engaging Instagram caption about {topic}.
Use a conversational, trendy tone.
Include relevant emojis.
End with 10-15 relevant hashtags.
Maximum 2200 characters.',
  image_prompt TEXT NOT NULL DEFAULT 'Create a professional social media image about {topic}. Style: {imageStyle}. Modern, minimal design. No text overlay. High quality, 1:1 square format.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.settings (id) VALUES (1);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read settings" ON public.settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write settings" ON public.settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for generated images (public so Instagram Graph can fetch by URL)
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);
CREATE POLICY "Public read generated images" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');
CREATE POLICY "Authenticated upload generated images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'generated-images');
CREATE POLICY "Service role manage generated images" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'generated-images') WITH CHECK (bucket_id = 'generated-images');

-- pg_cron + pg_net for daily scheduled run
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
