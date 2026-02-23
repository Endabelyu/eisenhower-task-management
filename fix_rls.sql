-- 1. Enable Row Level Security (RLS) on your imported table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. Delete any old broken policies just in case
DROP POLICY IF EXISTS "Users manage own tasks" ON public.tasks;

-- 3. Create the security rule allowing users to read, create, edit, and delete their own tasks
CREATE POLICY "Users manage own tasks"
ON public.tasks FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Enable automatic UUID generation for new tasks (otherwise you can't insert new tasks)
ALTER TABLE public.tasks ALTER COLUMN id SET DEFAULT gen_random_uuid();
