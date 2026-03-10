import {
  getTimeDisplay,
  getUrgencyColor,
  isUrgent,
  formatDuration,
  formatDateTime,
  getWeekString,
} from '../../src/utils/time';
import { UrgencyColors } from '../../src/constants/colors';

describe('getTimeDisplay', () => {
  it('shows "Happening now" for past start times', () => {
    const past = new Date(Date.now() - 30 * 60000).toISOString();
    expect(getTimeDisplay(past)).toBe('Happening now');
  });

  it('shows minutes for less than 1 hour', () => {
    const future = new Date(Date.now() + 45 * 60000).toISOString();
    expect(getTimeDisplay(future)).toContain('45 min');
  });

  it('shows hours and minutes', () => {
    const future = new Date(Date.now() + 90 * 60000).toISOString();
    const display = getTimeDisplay(future);
    expect(display).toContain('hr');
    expect(display).toContain('min');
  });

  it('shows just hours when no remainder', () => {
    const future = new Date(Date.now() + 120 * 60000).toISOString();
    const display = getTimeDisplay(future);
    expect(display).toContain('2hr');
  });

  it('shows "Starting now" for 0 minutes', () => {
    const now = new Date().toISOString();
    const display = getTimeDisplay(now);
    expect(['Starting now', 'Starts in 0 min'].includes(display)).toBe(true);
  });
});

describe('getUrgencyColor', () => {
  it('returns green (now) for past start times', () => {
    const past = new Date(Date.now() - 10 * 60000).toISOString();
    expect(getUrgencyColor(past)).toBe(UrgencyColors.now);
  });

  it('returns red (urgent) for <30 min away', () => {
    const soon = new Date(Date.now() + 20 * 60000).toISOString();
    expect(getUrgencyColor(soon)).toBe(UrgencyColors.urgent);
  });

  it('returns orange for 30-59 min away', () => {
    const orange = new Date(Date.now() + 45 * 60000).toISOString();
    expect(getUrgencyColor(orange)).toBe(UrgencyColors.soon);
  });

  it('returns blue for 60+ min away', () => {
    const far = new Date(Date.now() + 90 * 60000).toISOString();
    expect(getUrgencyColor(far)).toBe(UrgencyColors.normal);
  });
});

describe('isUrgent', () => {
  it('returns true for sessions 1-29 min away', () => {
    const urgent = new Date(Date.now() + 15 * 60000).toISOString();
    expect(isUrgent(urgent)).toBe(true);
  });

  it('returns false for sessions 30+ min away', () => {
    const notUrgent = new Date(Date.now() + 45 * 60000).toISOString();
    expect(isUrgent(notUrgent)).toBe(false);
  });

  it('returns false for past start times', () => {
    const past = new Date(Date.now() - 10 * 60000).toISOString();
    expect(isUrgent(past)).toBe(false);
  });
});

describe('formatDuration', () => {
  it('formats durations under 60 min as minutes', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formats exact hours', () => {
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(120)).toBe('2 hr');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1 hr 30 min');
    expect(formatDuration(75)).toBe('1 hr 15 min');
  });
});

describe('getWeekString', () => {
  it('returns string in YYYY-WNN format', () => {
    const weekStr = getWeekString(new Date('2026-03-10'));
    expect(weekStr).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('returns consistent value for same week', () => {
    const monday = new Date('2026-03-09');
    const friday = new Date('2026-03-13');
    expect(getWeekString(monday)).toBe(getWeekString(friday));
  });

  it('returns different values for different weeks', () => {
    const week1 = new Date('2026-03-03');
    const week2 = new Date('2026-03-10');
    expect(getWeekString(week1)).not.toBe(getWeekString(week2));
  });
});
