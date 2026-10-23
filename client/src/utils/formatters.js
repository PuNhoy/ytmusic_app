/**
 * Formats time in seconds to mm:ss or hh:mm:ss format.
 * @param {number} sec - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return '0:00';

  const totalSeconds = Math.floor(sec);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Decodes HTML entities commonly found in YouTube API responses.
 * @param {string} text
 * @returns {string}
 */
export function decodeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");
}
