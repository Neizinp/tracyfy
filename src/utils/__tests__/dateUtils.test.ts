import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      // Test specific date: November 29, 2024
      const timestamp = new Date('2024-11-29T15:30:00').getTime();
      const result = formatDate(timestamp);

      expect(result).toBe('2024-11-29');
    });

    it('should pad single-digit months and days with zero', () => {
      // January 5, 2024
      const timestamp = new Date('2024-01-05T10:00:00').getTime();
      const result = formatDate(timestamp);

      expect(result).toBe('2024-01-05');
    });

    it('should handle end of year dates', () => {
      // December 31, 2023
      const timestamp = new Date('2023-12-31T23:59:59').getTime();
      const result = formatDate(timestamp);

      expect(result).toBe('2023-12-31');
    });

    it('should always use YYYY-MM-DD format regardless of locale', () => {
      const timestamp = Date.now();
      const result = formatDate(timestamp);

      // Verify format matches YYYY-MM-DD pattern
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime as YYYY-MM-DD HH:mm:ss', () => {
      // November 29, 2024 15:30:45
      const timestamp = new Date('2024-11-29T15:30:45').getTime();
      const result = formatDateTime(timestamp);

      expect(result).toBe('2024-11-29 15:30:45');
    });

    it('should use 24-hour time format', () => {
      // 11:30 PM should be 23:30
      const timestamp = new Date('2024-11-29T23:30:00').getTime();
      const result = formatDateTime(timestamp);

      expect(result).toContain('23:30:00');
    });

    it('should pad single-digit hours, minutes, and seconds with zero', () => {
      // 3:05:09 AM should be 03:05:09
      const timestamp = new Date('2024-01-05T03:05:09').getTime();
      const result = formatDateTime(timestamp);

      expect(result).toBe('2024-01-05 03:05:09');
    });

    it('should always use YYYY-MM-DD HH:mm:ss format regardless of locale', () => {
      const timestamp = Date.now();
      const result = formatDateTime(timestamp);

      // Verify format matches YYYY-MM-DD HH:mm:ss pattern
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should not show 1970 for a valid timestamp', () => {
      // December 7, 2025 12:34:56 UTC
      const timestamp = Date.UTC(2025, 11, 7, 12, 34, 56); // months are 0-based
      expect(formatDateTime(timestamp)).not.toContain('1970');
    });

    it('should show 1970 for a zero timestamp', () => {
      expect(formatDateTime(0)).toContain('1970');
    });
  });
});
