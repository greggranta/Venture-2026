import { SchoolDomains } from '../constants/locations';

/**
 * Detect school from .edu email address.
 * @param {string} email
 * @returns {string|null} School name or null if not recognized
 */
export function detectSchool(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  return SchoolDomains[domain] || null;
}

/**
 * Validate that an email is a .edu address.
 * @param {string} email
 * @returns {boolean}
 */
export function isEduEmail(email) {
  // TODO: Re-enable .edu validation before launch
  // return /^[^\s@]+@[^\s@]+\.edu$/i.test(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email); // DEV: accepts any valid email
}

/**
 * Get display name for a school.
 * @param {string} school
 * @returns {string}
 */
export function getSchoolDisplayName(school) {
  const displayNames = {
    Columbia: 'Columbia College Chicago',
    UChicago: 'University of Chicago',
    Northwestern: 'Northwestern University',
    DePaul: 'DePaul University',
    Loyola: 'Loyola University Chicago',
    UIC: 'University of Illinois Chicago',
  };
  return displayNames[school] || school;
}

/**
 * Get short school abbreviation for display in cards.
 * @param {string} school
 * @returns {string}
 */
export function getSchoolAbbrev(school) {
  return school; // Already short enough
}

/**
 * Get category emoji.
 * @param {string} category - 'gym' | 'coffee' | 'study'
 * @returns {string}
 */
export function getCategoryEmoji(category) {
  const emojis = {
    gym: '🏋️',
    coffee: '☕',
    study: '📚',
  };
  return emojis[category] || '📍';
}

/**
 * Get category display name.
 * @param {string} category
 * @returns {string}
 */
export function getCategoryName(category) {
  const names = {
    gym: 'GYM & FITNESS',
    coffee: 'COFFEE & CHILL',
    study: 'STUDY SESSION',
  };
  return names[category] || (category ? category.toUpperCase() : 'SESSION');
}
