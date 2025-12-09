/**
 * Date formatting utilities for consistent date/time display
 * throughout the application.
 *
 * Format: YYYY-MM-DD HH:mm:ss (24-hour time)
 */

/**
 * Formats a timestamp to YYYY-MM-DD HH:mm:ss format (24-hour time)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string
 * @example formatDateTime(1700000000000) // "2023-11-14 22:13:20"
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a timestamp to YYYY-MM-DD format (date only)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 * @example formatDate(1700000000000) // "2023-11-14"
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
