-- Create Subtasks table (child items of tasks)
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Create Policy: Users can manage their own subtasks
DROP POLICY IF EXISTS "Users manage own subtasks" ON public.subtasks;
CREATE POLICY "Users manage own subtasks"
ON public.subtasks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
