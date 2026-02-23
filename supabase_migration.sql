-- Create Tasks table with RLS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  urgent BOOLEAN NOT NULL DEFAULT false,
  important BOOLEAN NOT NULL DEFAULT false,
  quadrant TEXT NOT NULL CHECK (quadrant IN ('do','schedule','delegate','hold')),
  due_date TIMESTAMPTZ,
  estimated_duration INT NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in-progress','completed','hold')),
  "order" INT NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create Policy: Users can manage their own tasks
DROP POLICY IF EXISTS "Users manage own tasks" ON public.tasks;
CREATE POLICY "Users manage own tasks"
ON public.tasks FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
