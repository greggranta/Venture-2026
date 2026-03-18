export const LEVELS = [
  {
    level: 1,
    name: 'Explorer',
    badge: '🌱',
    min: 0,
    max: 49,
    color: '#7CB87C',
    perks: [
      'Access to all session types',
      'Earn tokens by showing up',
      'Build your vibe score',
    ],
  },
  {
    level: 2,
    name: 'Regular',
    badge: '⭐',
    min: 50,
    max: 149,
    color: '#F5A623',
    perks: [
      'Everything in Explorer',
      'Early access to new session types',
      'Regular badge on your profile',
    ],
  },
  {
    level: 3,
    name: 'Insider',
    badge: '💎',
    min: 150,
    max: null,
    color: '#7B61FF',
    perks: [
      'Everything in Regular',
      'Early access to new features',
      'Partner offers & campus discounts',
      'Exclusive Insider badge on your profile',
    ],
  },
];

export function getLevelInfo(tokenBalance = 0) {
  const tokens = tokenBalance || 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (tokens >= LEVELS[i].min) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getNextLevel(tokenBalance = 0) {
  const current = getLevelInfo(tokenBalance);
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level + 1);
  return nextIndex !== -1 ? LEVELS[nextIndex] : null;
}

export function getProgressToNextLevel(tokenBalance = 0) {
  const tokens = tokenBalance || 0;
  const current = getLevelInfo(tokens);
  const next = getNextLevel(tokens);
  if (!next) return 1; // already max level
  const range = next.min - current.min;
  const progress = tokens - current.min;
  return Math.min(progress / range, 1);
}
