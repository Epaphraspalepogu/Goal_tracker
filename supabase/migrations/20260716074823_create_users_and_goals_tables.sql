/*
# Create users and goals tables for GoalFlow

1. New Tables
- `profiles` — public user profile data (1:1 with auth.users)
  - `id` (uuid, primary key, references auth.users)
  - `name` (text, full name)
  - `username` (text, unique, lowercase)
  - `email` (text, unique)
  - `photo` (text, avatar URL, nullable)
  - `created_at` (timestamptz)
- `goals` — daily goals owned by a user
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles.id, defaults to auth.uid())
  - `goal_date` (date, the day this goal belongs to)
  - `title` (text, not null)
  - `description` (text)
  - `start_time` (time)
  - `end_time` (time)
  - `category` (text)
  - `priority` (text, one of low/medium/high)
  - `color` (text, hex color for UI)
  - `status` (text, one of pending/completed/skipped)
  - `sort_order` (integer, for drag-and-drop ordering)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- profiles: each authenticated user can read ALL profiles (community feature),
  but can only insert/update/delete their OWN profile row.
- goals: each authenticated user has full CRUD on their own goals only.
  All authenticated users can READ all goals (community feature), but writes
  are restricted to the owner via auth.uid() = user_id.

3. Important Notes
- `user_id` defaults to auth.uid() so frontend inserts omitting user_id succeed.
- A trigger auto-creates a profile row when a new auth user signs up.
- username uniqueness is enforced via a unique index.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  photo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read all profiles (community feature)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- A user can insert only their own profile row
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- A user can update only their own profile row
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- A user can delete only their own profile row
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ============================================================
-- GOALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_date date NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  start_time time,
  end_time time,
  category text DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  color text DEFAULT '#6366f1',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all goals (community feature)
DROP POLICY IF EXISTS "goals_select_all" ON public.goals;
CREATE POLICY "goals_select_all"
ON public.goals FOR SELECT
TO authenticated
USING (true);

-- A user can insert only their own goals
DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
CREATE POLICY "goals_insert_own"
ON public.goals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- A user can update only their own goals
DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
CREATE POLICY "goals_update_own"
ON public.goals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- A user can delete only their own goals
DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
CREATE POLICY "goals_delete_own"
ON public.goals FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_goals_user_date ON public.goals(user_id, goal_date);
CREATE INDEX IF NOT EXISTS idx_goals_date ON public.goals(goal_date);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- UPDATED_AT TRIGGER FOR GOALS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS goals_set_updated_at ON public.goals;
CREATE TRIGGER goals_set_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
