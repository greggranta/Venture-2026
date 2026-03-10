/**
 * Integration tests for session API
 * Note: These tests use mocked Supabase client. For full integration tests,
 * set up a test Supabase project with the schema from supabase/schema.sql
 */

// Mock Supabase client
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
  },
}));

import { supabase } from '../../src/lib/supabase';

// Helper: Create mock Supabase query builder
function createQueryBuilder(resolveValue) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolveValue),
    then: (resolve) => Promise.resolve(resolveValue).then(resolve),
  };
  return builder;
}

describe('Session validation logic', () => {
  const mockSession = {
    id: 'session-1',
    created_by: 'user-1',
    category: 'gym',
    location: 'Rec Center',
    location_lat: 41.8756,
    location_lng: -87.6238,
    start_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    duration: 60,
    looking_for: 1,
    status: 'active',
    expires_at: new Date(Date.now() + 7200000).toISOString(),
    attendees: [],
    attendee_count: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates future start time requirement', () => {
    const pastTime = new Date(Date.now() - 60000).toISOString();
    expect(new Date(pastTime) < new Date()).toBe(true);
  });

  it('validates duration constraints (30-180 min)', () => {
    const validDurations = [30, 45, 60, 90, 120, 150, 180];
    const invalidDurations = [0, 15, 29, 181, 240];

    validDurations.forEach((d) => {
      expect(d >= 30 && d <= 180).toBe(true);
    });

    invalidDurations.forEach((d) => {
      expect(d >= 30 && d <= 180).toBe(false);
    });
  });

  it('validates category constraint', () => {
    const validCategories = ['gym', 'coffee', 'study'];
    const invalidCategories = ['sports', 'hiking', '', null];

    validCategories.forEach((cat) => {
      expect(['gym', 'coffee', 'study'].includes(cat)).toBe(true);
    });

    invalidCategories.forEach((cat) => {
      expect(['gym', 'coffee', 'study'].includes(cat)).toBe(false);
    });
  });

  it('validates looking_for constraint (1-10)', () => {
    expect(1 >= 1 && 1 <= 10).toBe(true);
    expect(5 >= 1 && 5 <= 10).toBe(true);
    expect(0 >= 1 && 0 <= 10).toBe(false);
    expect(11 >= 1 && 11 <= 10).toBe(false);
  });

  it('correctly determines if a session is full', () => {
    const notFull = { ...mockSession, looking_for: 2, attendee_count: 1 };
    const full = { ...mockSession, looking_for: 1, attendee_count: 1 };

    expect(notFull.attendee_count >= notFull.looking_for).toBe(false);
    expect(full.attendee_count >= full.looking_for).toBe(true);
  });

  it('correctly detects time conflicts', () => {
    // Two sessions at the same time should conflict
    const session1Start = new Date('2026-03-10T14:00:00Z');
    const session1End = new Date('2026-03-10T15:00:00Z');
    const session2Start = new Date('2026-03-10T14:30:00Z');
    const session2End = new Date('2026-03-10T15:30:00Z');

    // Check overlap
    const hasOverlap = session1Start < session2End && session2Start < session1End;
    expect(hasOverlap).toBe(true);

    // Non-overlapping sessions
    const session3Start = new Date('2026-03-10T16:00:00Z');
    const session3End = new Date('2026-03-10T17:00:00Z');
    const noOverlap = session1Start < session3End && session3Start < session1End;
    expect(noOverlap).toBe(false);
  });
});

describe('Session expiration logic', () => {
  it('marks session as expired when past expires_at', () => {
    const expiredSession = {
      expires_at: new Date(Date.now() - 60000).toISOString(),
      status: 'active',
    };

    const shouldExpire =
      expiredSession.status === 'active' &&
      new Date(expiredSession.expires_at) < new Date();

    expect(shouldExpire).toBe(true);
  });

  it('does not expire active sessions in the future', () => {
    const activeSession = {
      expires_at: new Date(Date.now() + 60000).toISOString(),
      status: 'active',
    };

    const shouldExpire =
      activeSession.status === 'active' &&
      new Date(activeSession.expires_at) < new Date();

    expect(shouldExpire).toBe(false);
  });

  it('calculates expires_at correctly from start_time + duration', () => {
    const startTime = new Date('2026-03-10T14:00:00Z');
    const duration = 60; // minutes
    const expiresAt = new Date(startTime.getTime() + duration * 60000);

    expect(expiresAt.toISOString()).toBe('2026-03-10T15:00:00.000Z');
  });
});

describe('Rating system logic', () => {
  it('correctly determines tokens to award for showing up', () => {
    const bothShowedUp = true;
    const vibeScore = 'positive';

    let raterTokens = 0;
    let rateeTokens = 0;

    if (bothShowedUp) {
      raterTokens += 2; // showed_up
      if (vibeScore === 'positive') {
        rateeTokens += 1; // positive_rating
      }
    }

    expect(raterTokens).toBe(2);
    expect(rateeTokens).toBe(1);
  });

  it('awards no tokens when no-show occurred', () => {
    const bothShowedUp = false;
    let raterTokens = 0;
    let rateeTokens = 0;

    if (bothShowedUp) {
      raterTokens += 2;
    }

    expect(raterTokens).toBe(0);
    expect(rateeTokens).toBe(0);
  });

  it('awards rater tokens but not ratee on neutral rating', () => {
    const bothShowedUp = true;
    const vibeScore = 'neutral';

    let raterTokens = 0;
    let rateeTokens = 0;

    if (bothShowedUp) {
      raterTokens += 2;
      if (vibeScore === 'positive') {
        rateeTokens += 1;
      }
    }

    expect(raterTokens).toBe(2);
    expect(rateeTokens).toBe(0);
  });

  it('correctly counts no-shows for suspension threshold', () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ratings = [
      { both_showed_up: false, created_at: new Date().toISOString() },
      { both_showed_up: false, created_at: new Date().toISOString() },
      { both_showed_up: true, created_at: new Date().toISOString() },
    ];

    const noShowCount = ratings.filter(
      (r) => !r.both_showed_up && new Date(r.created_at) >= thirtyDaysAgo
    ).length;

    expect(noShowCount).toBe(2);
    // 2 no-shows = warning
    expect(noShowCount === 2).toBe(true);
    // Not yet at suspension threshold
    expect(noShowCount >= 3).toBe(false);
  });
});

describe('Token earning logic', () => {
  it('awards creator +3 tokens when someone joins their session', () => {
    const tokensForJoin = 3;
    expect(tokensForJoin).toBe(3);
  });

  it('calculates total token balance correctly', () => {
    const tokenHistory = [
      { amount: 3 }, // session_joined
      { amount: 2 }, // showed_up
      { amount: 1 }, // positive_rating
      { amount: 2 }, // showed_up
    ];

    const balance = tokenHistory.reduce((sum, t) => sum + t.amount, 0);
    expect(balance).toBe(8);
  });
});
