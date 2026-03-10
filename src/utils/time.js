import { UrgencyColors } from '../constants/colors';

/**
 * Get a human-readable time display for a session start time.
 * @param {string|Date} startTime
 * @returns {string}
 */
export function getTimeDisplay(startTime) {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start - now;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 0) {
    const happeningMins = Math.abs(diffMinutes);
    if (happeningMins < 120) return 'Happening now';
    return 'Ended';
  }
  if (diffMinutes === 0) return 'Starting now';
  if (diffMinutes < 60) return `Starts in ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;

  if (remainingMins === 0) return `Starts in ${diffHours}hr`;
  return `Starts in ${diffHours}hr ${remainingMins}min`;
}

/**
 * Get urgency color based on time until session starts.
 * @param {string|Date} startTime
 * @returns {string} hex color
 */
export function getUrgencyColor(startTime) {
  const now = new Date();
  const start = new Date(startTime);
  const diffMinutes = Math.floor((start - now) / 60000);

  if (diffMinutes < 0) return UrgencyColors.now;
  if (diffMinutes < 30) return UrgencyColors.urgent;
  if (diffMinutes < 60) return UrgencyColors.soon;
  return UrgencyColors.normal;
}

/**
 * Check if a session is urgent (< 30 min away).
 * @param {string|Date} startTime
 * @returns {boolean}
 */
export function isUrgent(startTime) {
  const now = new Date();
  const start = new Date(startTime);
  const diffMinutes = Math.floor((start - now) / 60000);
  return diffMinutes > 0 && diffMinutes < 30;
}

/**
 * Format a date/time for display (e.g., "Today at 4:00pm").
 * @param {string|Date} dateTime
 * @returns {string}
 */
export function formatDateTime(dateTime) {
  const date = new Date(dateTime);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Format duration in minutes to human-readable string.
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMins} min`;
}

/**
 * Get ISO week string for streak tracking.
 * @param {Date} date - defaults to now
 * @returns {string} Format: "YYYY-WNN"
 */
export function getWeekString(date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Parse a week string into a Date (Monday of that week).
 * @param {string} weekStr - Format: "YYYY-WNN"
 * @returns {Date}
 */
export function parseWeekString(weekStr) {
  const [year, week] = weekStr.split('-W').map(Number);
  const jan1 = new Date(year, 0, 1);
  const daysToFirstMonday = (8 - jan1.getDay()) % 7;
  const firstMonday = new Date(jan1);
  firstMonday.setDate(jan1.getDate() + daysToFirstMonday);
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  return weekStart;
}

/**
 * Calculate minutes from now until a given time.
 * @param {string|Date} time
 * @returns {number} - negative if in the past
 */
export function minutesFromNow(time) {
  return Math.floor((new Date(time) - new Date()) / 60000);
}
