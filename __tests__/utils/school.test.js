import {
  detectSchool,
  isEduEmail,
  getSchoolDisplayName,
  getCategoryEmoji,
  getCategoryName,
} from '../../src/utils/school';

describe('detectSchool', () => {
  it('detects Columbia from colum.edu', () => {
    expect(detectSchool('student@colum.edu')).toBe('Columbia');
  });

  it('detects UChicago from uchicago.edu', () => {
    expect(detectSchool('student@uchicago.edu')).toBe('UChicago');
  });

  it('detects Northwestern from northwestern.edu', () => {
    expect(detectSchool('student@northwestern.edu')).toBe('Northwestern');
  });

  it('detects DePaul from depaul.edu', () => {
    expect(detectSchool('student@depaul.edu')).toBe('DePaul');
  });

  it('detects Loyola from luc.edu', () => {
    expect(detectSchool('student@luc.edu')).toBe('Loyola');
  });

  it('detects UIC from uic.edu', () => {
    expect(detectSchool('student@uic.edu')).toBe('UIC');
  });

  it('returns null for unknown .edu domain', () => {
    expect(detectSchool('student@unknown-university.edu')).toBeNull();
  });

  it('returns null for non-.edu email', () => {
    expect(detectSchool('student@gmail.com')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(detectSchool(null)).toBeNull();
  });

  it('is case-insensitive for domain', () => {
    expect(detectSchool('student@COLUM.EDU')).toBe('Columbia');
  });
});

describe('isEduEmail', () => {
  it('accepts valid .edu emails', () => {
    expect(isEduEmail('john@colum.edu')).toBe(true);
    expect(isEduEmail('jane.doe@northwestern.edu')).toBe(true);
  });

  it('rejects non-.edu emails', () => {
    expect(isEduEmail('john@gmail.com')).toBe(false);
    expect(isEduEmail('john@university.org')).toBe(false);
  });

  it('rejects invalid email formats', () => {
    expect(isEduEmail('notanemail')).toBe(false);
    expect(isEduEmail('@.edu')).toBe(false);
    expect(isEduEmail('')).toBe(false);
  });
});

describe('getSchoolDisplayName', () => {
  it('returns full names for recognized schools', () => {
    expect(getSchoolDisplayName('Columbia')).toBe('Columbia College Chicago');
    expect(getSchoolDisplayName('Northwestern')).toBe('Northwestern University');
  });

  it('returns input for unknown schools', () => {
    expect(getSchoolDisplayName('Unknown')).toBe('Unknown');
  });
});

describe('getCategoryEmoji', () => {
  it('returns correct emoji for gym', () => {
    expect(getCategoryEmoji('gym')).toBe('🏋️');
  });

  it('returns correct emoji for coffee', () => {
    expect(getCategoryEmoji('coffee')).toBe('☕');
  });

  it('returns correct emoji for study', () => {
    expect(getCategoryEmoji('study')).toBe('📚');
  });

  it('returns fallback for unknown category', () => {
    expect(getCategoryEmoji('unknown')).toBe('📍');
  });
});

describe('getCategoryName', () => {
  it('returns correct display names', () => {
    expect(getCategoryName('gym')).toBe('GYM & FITNESS');
    expect(getCategoryName('coffee')).toBe('COFFEE & CHILL');
    expect(getCategoryName('study')).toBe('STUDY SESSION');
  });
});
