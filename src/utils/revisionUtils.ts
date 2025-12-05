/**
 * Helper to increment revision number (e.g. "01" -> "02")
 * @param currentRevision The current revision string (e.g., "01", "05", "10")
 * @returns The next revision string (e.g., "02", "06", "11")
 */
export const incrementRevision = (currentRevision: string): string => {
  const num = parseInt(currentRevision, 10);
  if (isNaN(num)) return '01';
  return String(num + 1).padStart(2, '0');
};
