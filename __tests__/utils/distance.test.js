import { calculateDistance, formatDistance } from '../../src/utils/distance';

describe('calculateDistance', () => {
  it('returns null when coordinates are missing', () => {
    expect(calculateDistance(null, null, 42.0, -87.0)).toBeNull();
    expect(calculateDistance(41.0, -87.0, null, null)).toBeNull();
  });

  it('calculates distance between two coordinates (Haversine)', () => {
    // Chicago Loop to Evanston (~11 miles)
    const distance = calculateDistance(
      41.8781, -87.6298,  // Chicago Loop
      42.0451, -87.6877   // Evanston
    );
    expect(parseFloat(distance)).toBeGreaterThan(10);
    expect(parseFloat(distance)).toBeLessThan(13);
  });

  it('returns 0.0 for identical coordinates', () => {
    const distance = calculateDistance(41.8781, -87.6298, 41.8781, -87.6298);
    expect(parseFloat(distance)).toBe(0);
  });

  it('returns string with 1 decimal place', () => {
    const distance = calculateDistance(41.8756, -87.6238, 41.8760, -87.6243);
    expect(distance).toMatch(/^\d+\.\d$/);
  });

  it('calculates short campus distances correctly', () => {
    // Very close locations (within 0.5 miles)
    const distance = calculateDistance(
      41.8756, -87.6238,   // Columbia Library
      41.8760, -87.6243    // Columbia Rec Center
    );
    expect(parseFloat(distance)).toBeLessThan(0.5);
  });
});

describe('formatDistance', () => {
  it('formats distances over 0.1 miles', () => {
    expect(formatDistance('0.2')).toBe('0.2mi');
    expect(formatDistance('1.5')).toBe('1.5mi');
    expect(formatDistance(3.7)).toBe('3.7mi');
  });

  it('shows "Nearby" for very short distances', () => {
    expect(formatDistance('0.05')).toBe('Nearby');
    expect(formatDistance('0.0')).toBe('Nearby');
  });

  it('returns empty string for null/undefined', () => {
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(undefined)).toBe('');
  });
});
