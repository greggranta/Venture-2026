-- ============================================================
-- VENTURE APP - SEED DATA (Development)
-- ============================================================

-- Insert test users (requires auth.users entries first in production)
INSERT INTO users (id, email, name, school, graduation_year, photo_url, verified, bio) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'jordan@colum.edu',
  'Jordan Kim',
  'Columbia',
  2026,
  'https://picsum.photos/seed/jordan/200',
  true,
  'Always down for a lift or coffee. Econ major.'
),
(
  '00000000-0000-0000-0000-000000000002',
  'alex@northwestern.edu',
  'Alex Martinez',
  'Northwestern',
  2025,
  'https://picsum.photos/seed/alex/200',
  true,
  'CS major, coffee addict. Let''s grind together.'
),
(
  '00000000-0000-0000-0000-000000000003',
  'casey@depaul.edu',
  'Casey Lee',
  'DePaul',
  2026,
  'https://picsum.photos/seed/casey/200',
  true,
  'Into fitness and studying. Hit me up for gym sessions!'
),
(
  '00000000-0000-0000-0000-000000000004',
  'sam@luc.edu',
  'Sam Rivera',
  'Loyola',
  2027,
  'https://picsum.photos/seed/sam/200',
  true,
  'Premed student. Study buddy wanted!'
),
(
  '00000000-0000-0000-0000-000000000005',
  'taylor@uic.edu',
  'Taylor Nguyen',
  'UIC',
  2025,
  'https://picsum.photos/seed/taylor/200',
  true,
  'Engineering student. Coffee and study sessions are my vibe.'
);

-- Insert test sessions
INSERT INTO sessions (
  id, created_by, category, location, location_lat, location_lng,
  start_time, duration, activity_detail, looking_for, status, expires_at
) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'gym',
  'Rec Center',
  41.8760, -87.6243,
  NOW() + INTERVAL '1 hour',
  60,
  'Chest day',
  1,
  'active',
  NOW() + INTERVAL '2 hours'
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'coffee',
  'Starbucks - Wabash',
  41.8772, -87.6265,
  NOW() + INTERVAL '30 minutes',
  45,
  'Quick catch-up before class',
  1,
  'active',
  NOW() + INTERVAL '1 hour 15 minutes'
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'study',
  'Library - Main Floor',
  41.8756, -87.6238,
  NOW() + INTERVAL '2 hours',
  120,
  'Econ 201 exam prep',
  2,
  'active',
  NOW() + INTERVAL '4 hours'
),
(
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000004',
  'gym',
  'Planet Fitness - Loop',
  41.8819, -87.6278,
  NOW() + INTERVAL '3 hours',
  90,
  'Leg day',
  1,
  'active',
  NOW() + INTERVAL '4 hours 30 minutes'
);

-- Insert test attendees
INSERT INTO session_attendees (session_id, user_id) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000005'
);

-- Insert test ratings (completed sessions)
INSERT INTO sessions (
  id, created_by, category, location, location_lat, location_lng,
  start_time, duration, activity_detail, looking_for, status, expires_at
) VALUES
(
  '10000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'gym',
  'Rec Center',
  41.8760, -87.6243,
  NOW() - INTERVAL '2 days',
  60,
  'Back day',
  1,
  'expired',
  NOW() - INTERVAL '2 days' + INTERVAL '1 hour'
);

INSERT INTO session_attendees (session_id, user_id) VALUES
(
  '10000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000003'
);

INSERT INTO ratings (session_id, rater_id, ratee_id, both_showed_up, vibe_score) VALUES
(
  '10000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  true,
  'positive'
),
(
  '10000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  true,
  'positive'
);

-- Insert tokens
INSERT INTO tokens (user_id, amount, reason, session_id) VALUES
('00000000-0000-0000-0000-000000000001', 2, 'showed_up', '10000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000001', 1, 'positive_rating', '10000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000003', 2, 'showed_up', '10000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000003', 1, 'positive_rating', '10000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000001', 3, 'session_joined', '10000000-0000-0000-0000-000000000010');

-- Initialize streaks
INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_week) VALUES
('00000000-0000-0000-0000-000000000001', 5, 7, TO_CHAR(NOW(), 'IYYY-"W"IW')),
('00000000-0000-0000-0000-000000000002', 3, 5, TO_CHAR(NOW(), 'IYYY-"W"IW')),
('00000000-0000-0000-0000-000000000003', 2, 4, TO_CHAR(NOW(), 'IYYY-"W"IW')),
('00000000-0000-0000-0000-000000000004', 1, 1, TO_CHAR(NOW(), 'IYYY-"W"IW')),
('00000000-0000-0000-0000-000000000005', 7, 9, TO_CHAR(NOW(), 'IYYY-"W"IW'));
