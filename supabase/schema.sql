-- ============================================================
-- VENTURE APP - SUPABASE DATABASE SCHEMA
-- Version 1.0 MVP - March 2026
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ============================================================
-- TABLES
-- ============================================================

-- Table: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  graduation_year INTEGER,
  photo_url TEXT NOT NULL,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  suspended_until TIMESTAMPTZ,
  no_show_count INTEGER DEFAULT 0,

  CONSTRAINT valid_email CHECK (email LIKE '%@%.edu'),
  CONSTRAINT valid_school CHECK (school IN ('Columbia', 'UChicago', 'Northwestern', 'DePaul', 'Loyola', 'UIC')),
  CONSTRAINT valid_bio_length CHECK (bio IS NULL OR LENGTH(bio) <= 150)
);

CREATE INDEX idx_users_school ON users(school);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verified ON users(verified);

-- Table: sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  activity_detail TEXT,
  looking_for INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT valid_category CHECK (category IN ('gym', 'coffee', 'study')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'cancelled')),
  CONSTRAINT valid_duration CHECK (duration BETWEEN 30 AND 180),
  CONSTRAINT valid_looking_for CHECK (looking_for BETWEEN 1 AND 10),
  CONSTRAINT valid_activity_detail_length CHECK (activity_detail IS NULL OR LENGTH(activity_detail) <= 100)
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_category ON sessions(category);
CREATE INDEX idx_sessions_location ON sessions(location_lat, location_lng);
CREATE INDEX idx_sessions_created_by ON sessions(created_by);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);

-- Table: session_attendees
CREATE TABLE session_attendees (
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (session_id, user_id)
);

CREATE INDEX idx_attendees_user ON session_attendees(user_id);
CREATE INDEX idx_attendees_session ON session_attendees(session_id);

-- Table: ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  both_showed_up BOOLEAN NOT NULL,
  vibe_score TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_vibe_score CHECK (
    vibe_score IS NULL OR
    vibe_score IN ('positive', 'neutral', 'negative')
  ),
  CONSTRAINT one_rating_per_session_pair UNIQUE (session_id, rater_id, ratee_id),
  CONSTRAINT cannot_rate_self CHECK (rater_id != ratee_id)
);

CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_id);
CREATE INDEX idx_ratings_session ON ratings(session_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at);

-- Table: tokens
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_reason CHECK (reason IN ('showed_up', 'positive_rating', 'session_joined')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_tokens_user ON tokens(user_id);
CREATE INDEX idx_tokens_created_at ON tokens(created_at);

-- Table: streaks
CREATE TABLE streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_week TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  send_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_notification_type CHECK (
    type IN ('session_join', 'reminder', 'rating_request', 'streak_update',
             'token_earned', 'warning', 'suspension')
  )
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_send_at ON notifications(send_at);

-- ============================================================
-- FUNCTIONS (COMPUTED FIELDS)
-- ============================================================

-- Function: Calculate User Vibe Score (0-100 percentage)
CREATE OR REPLACE FUNCTION get_vibe_score(input_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
  positive_count INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE vibe_score = 'positive')
  INTO total_count, positive_count
  FROM ratings
  WHERE ratee_id = input_user_id
    AND vibe_score IS NOT NULL;

  IF total_count = 0 THEN
    RETURN NULL;
  END IF;

  RETURN ROUND((positive_count::DECIMAL / total_count::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql;

-- Function: Get User Activity Counts (completed sessions)
CREATE OR REPLACE FUNCTION get_activity_counts(input_user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'gym', COUNT(*) FILTER (WHERE s.category = 'gym'),
    'coffee', COUNT(*) FILTER (WHERE s.category = 'coffee'),
    'study', COUNT(*) FILTER (WHERE s.category = 'study')
  )
  FROM sessions s
  LEFT JOIN session_attendees sa ON s.id = sa.session_id
  WHERE (s.created_by = input_user_id OR sa.user_id = input_user_id)
    AND s.status = 'expired';
$$ LANGUAGE sql;

-- Function: Get User Token Balance
CREATE OR REPLACE FUNCTION get_token_balance(input_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM tokens
  WHERE user_id = input_user_id;
$$ LANGUAGE sql;

-- Function: Check Time Conflict (prevent double-booking)
CREATE OR REPLACE FUNCTION has_time_conflict(
  input_user_id UUID,
  input_start_time TIMESTAMPTZ,
  input_duration INTEGER,
  exclude_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  input_end_time TIMESTAMPTZ;
  conflict_count INTEGER;
BEGIN
  input_end_time := input_start_time + (input_duration || ' minutes')::INTERVAL;

  SELECT COUNT(*) INTO conflict_count
  FROM sessions s
  LEFT JOIN session_attendees sa ON s.id = sa.session_id
  WHERE (s.created_by = input_user_id OR sa.user_id = input_user_id)
    AND s.status = 'active'
    AND (exclude_session_id IS NULL OR s.id != exclude_session_id)
    AND (
      (s.start_time, s.start_time + (s.duration || ' minutes')::INTERVAL)
      OVERLAPS
      (input_start_time, input_end_time)
    );

  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Get session attendee count
CREATE OR REPLACE FUNCTION get_attendee_count(input_session_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM session_attendees
  WHERE session_id = input_session_id;
$$ LANGUAGE sql;

-- Function: Award tokens to a user
CREATE OR REPLACE FUNCTION award_tokens(
  input_user_id UUID,
  input_amount INTEGER,
  input_reason TEXT,
  input_session_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tokens (user_id, amount, reason, session_id)
  VALUES (input_user_id, input_amount, input_reason, input_session_id);
END;
$$ LANGUAGE plpgsql;

-- Function: Get current ISO week string (YYYY-WNN)
CREATE OR REPLACE FUNCTION get_current_week()
RETURNS TEXT AS $$
  SELECT TO_CHAR(NOW(), 'IYYY-"W"IW');
$$ LANGUAGE sql;

-- Function: Update user streak
CREATE OR REPLACE FUNCTION update_streak(input_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_week TEXT;
  streak_record RECORD;
  new_streak INTEGER;
BEGIN
  current_week := get_current_week();

  SELECT * INTO streak_record
  FROM streaks
  WHERE user_id = input_user_id;

  IF NOT FOUND THEN
    INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_week)
    VALUES (input_user_id, 1, 1, current_week);
    RETURN 1;
  END IF;

  IF streak_record.last_activity_week = current_week THEN
    RETURN streak_record.current_streak;
  END IF;

  -- Check if consecutive week
  IF streak_record.last_activity_week IS NOT NULL AND
     TO_DATE(current_week || '-1', 'IYYY-"W"IW-ID') -
     TO_DATE(streak_record.last_activity_week || '-1', 'IYYY-"W"IW-ID') = 7 THEN
    new_streak := streak_record.current_streak + 1;
  ELSE
    new_streak := 1;
  END IF;

  UPDATE streaks SET
    current_streak = new_streak,
    longest_streak = GREATEST(new_streak, streak_record.longest_streak),
    last_activity_week = current_week,
    updated_at = NOW()
  WHERE user_id = input_user_id;

  RETURN new_streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_select_verified_chicago"
ON users FOR SELECT
TO authenticated
USING (
  verified = true
  AND school IN ('Columbia', 'UChicago', 'Northwestern', 'DePaul', 'Loyola', 'UIC')
);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Sessions policies
CREATE POLICY "sessions_select_active"
ON sessions FOR SELECT
TO authenticated
USING (
  status IN ('active', 'expired')
  AND created_by IN (
    SELECT id FROM users
    WHERE school IN ('Columbia', 'UChicago', 'Northwestern', 'DePaul', 'Loyola', 'UIC')
    AND verified = true
  )
);

CREATE POLICY "sessions_insert_verified"
ON sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "sessions_update_creator"
ON sessions FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "sessions_delete_creator"
ON sessions FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Session attendees policies
CREATE POLICY "attendees_select_participant"
ON session_attendees FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR session_id IN (SELECT id FROM sessions WHERE created_by = auth.uid())
);

CREATE POLICY "attendees_insert_self"
ON session_attendees FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attendees_delete_self"
ON session_attendees FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ratings policies
CREATE POLICY "ratings_select_participant"
ON ratings FOR SELECT
TO authenticated
USING (auth.uid() = ratee_id OR auth.uid() = rater_id);

CREATE POLICY "ratings_insert_rater"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = rater_id);

-- Tokens policies
CREATE POLICY "tokens_select_own"
ON tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "streaks_select_own"
ON streaks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "streaks_select_public"
ON streaks FOR SELECT
TO authenticated
USING (true);

-- Notifications policies
CREATE POLICY "notifications_select_own"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CRON JOB: Expire old sessions every 5 minutes
-- ============================================================
SELECT cron.schedule(
  'expire-old-sessions',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/expire-sessions',
    headers := json_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    )::jsonb
  ) AS request_id;
  $$
);

-- Cron job: Send weekly streak reminders (Sunday 8pm)
SELECT cron.schedule(
  'weekly-streak-reminders',
  '0 20 * * 0',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/streak-reminders',
    headers := json_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    )::jsonb
  ) AS request_id;
  $$
);
