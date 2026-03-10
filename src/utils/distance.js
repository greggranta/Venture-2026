/**
 * Calculate distance between two geographic coordinates using Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {string} Distance in miles, formatted to 1 decimal place
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;

  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance.toFixed(1);
}

/**
 * Format distance for display.
 * @param {string|number} distance - Distance in miles
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance) {
  if (distance === null || distance === undefined) return '';
  const d = parseFloat(distance);
  if (d < 0.1) return 'Nearby';
  return `${d}mi`;
}
