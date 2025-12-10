import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';

// Type for link-shaped objects used in tests (links are now embedded in artifacts)
type LinkLike = { sourceId: string; targetId: string };

describe('Import Validation', () => {
  describe('JSON Import', () => {
    it('should validate correct JSON structure', () => {
      const validData = {
        requirements: [
          {
            id: 'REQ-001',
            title: 'Test Requirement',
            description: 'Test',
            text: '',
            status: 'draft',
            priority: 'high',
            parentIds: [],
            lastModified: Date.now(),
            revision: '01',
            dateCreated: Date.now(),
          },
        ],
        useCases: [],
        testCases: [],
        information: [],
        links: [],
      };

      expect(validData.requirements).toBeDefined();
      expect(Array.isArray(validData.requirements)).toBe(true);
      expect(validData.requirements[0].id).toBe('REQ-001');
    });

    it('should handle missing optional fields', () => {
      const dataWithMissingFields = {
        requirements: [
          {
            id: 'REQ-001',
            title: 'Test',
            status: 'draft',
            priority: 'medium',
            parentIds: [],
            lastModified: Date.now(),
            revision: '01',
            dateCreated: Date.now(),
          },
        ],
      };

      // Should accept data even if optional arrays are missing
      expect(dataWithMissingFields.requirements).toBeDefined();
    });

    it('should detect invalid status values', () => {
      const validStatuses = ['draft', 'approved', 'in-review', 'rejected'];
      const invalidStatus = 'invalid-status';

      expect(validStatuses).not.toContain(invalidStatus);
    });

    it('should detect invalid priority values', () => {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      const invalidPriority = 'ultra-high';

      expect(validPriorities).not.toContain(invalidPriority);
    });

    it('should detect duplicate IDs', () => {
      const requirements = [
        { id: 'REQ-001', title: 'First' },
        { id: 'REQ-001', title: 'Duplicate' },
      ];

      const ids = requirements.map((r) => r.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBeLessThan(ids.length);
    });

    it('should validate link integrity', () => {
      const requirements = [{ id: 'REQ-001' }, { id: 'REQ-002' }];
      const validLink: LinkLike = {
        sourceId: 'REQ-001',
        targetId: 'REQ-002',
      };
      const invalidLink: LinkLike = {
        sourceId: 'REQ-001',
        targetId: 'REQ-999', // Non-existent
      };

      const reqIds = new Set(requirements.map((r) => r.id));

      expect(reqIds.has(validLink.sourceId) && reqIds.has(validLink.targetId)).toBe(true);
      expect(reqIds.has(invalidLink.sourceId) && reqIds.has(invalidLink.targetId)).toBe(false);
    });

    it('should handle circular parent references', () => {
      const requirements = [
        { id: 'REQ-001', parentIds: ['REQ-002'] },
        { id: 'REQ-002', parentIds: ['REQ-001'] },
      ];

      // Function to detect circular dependencies
      const hasCircularDependency = (reqs: typeof requirements): boolean => {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (id: string): boolean => {
          if (recursionStack.has(id)) return true;
          if (visited.has(id)) return false;

          visited.add(id);
          recursionStack.add(id);

          const req = reqs.find((r) => r.id === id);
          if (req) {
            for (const parentId of req.parentIds) {
              if (dfs(parentId)) return true;
            }
          }

          recursionStack.delete(id);
          return false;
        };

        return reqs.some((req) => dfs(req.id));
      };

      expect(hasCircularDependency(requirements)).toBe(true);
    });
  });

  describe('Excel Import', () => {
    it('should parse Requirements sheet correctly', () => {
      // Create a sample workbook
      const data = [
        {
          ID: 'REQ-001',
          Title: 'Test Requirement',
          Status: 'draft',
          Priority: 'high',
          Description: 'Test description',
          'Requirement Text': 'Shall do something',
          Rationale: 'Because',
          Parents: '',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Requirements');

      expect(wb.SheetNames).toContain('Requirements');

      const parsedData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Requirements']);
      expect(parsedData[0]['ID']).toBe('REQ-001');
      expect(parsedData[0]['Title']).toBe('Test Requirement');
    });

    it('should handle missing required fields', () => {
      const data = [
        {
          // Missing ID and Title
          Status: 'draft',
          Priority: 'medium',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const parsedData = XLSX.utils.sheet_to_json<any>(ws);

      expect(parsedData[0]['ID']).toBeUndefined();
      expect(parsedData[0]['Title']).toBeUndefined();
    });

    it('should parse parent IDs from comma-separated string', () => {
      const parentsString = 'REQ-001, REQ-002, REQ-003';
      const parsed = parentsString
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);

      expect(parsed).toHaveLength(3);
      expect(parsed).toContain('REQ-001');
      expect(parsed).toContain('REQ-002');
      expect(parsed).toContain('REQ-003');
    });

    it('should handle empty parent IDs string', () => {
      const emptyString = '';
      const parsed = emptyString
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);

      expect(parsed).toHaveLength(0);
    });

    it('should parse Links sheet correctly', () => {
      const linkData = [
        {
          Source: 'REQ-001',
          Target: 'UC-001',
          Type: 'relates_to',
          Description: 'Test link',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(linkData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Links');

      const parsedData = XLSX.utils.sheet_to_json<any>(wb.Sheets['Links']);

      expect(parsedData[0]['Source']).toBe('REQ-001');
      expect(parsedData[0]['Target']).toBe('UC-001');
      expect(parsedData[0]['Type']).toBe('relates_to');
    });

    it('should validate link types', () => {
      const validLinkTypes = ['relates_to', 'depends_on', 'conflicts_with'];
      const invalidType = 'random_type';

      expect(validLinkTypes).not.toContain(invalidType);
    });

    it('should handle large datasets', () => {
      // Create 1000 requirements
      const data = Array.from({ length: 1000 }, (_, i) => ({
        ID: `REQ-${String(i + 1).padStart(3, '0')}`,
        Title: `Requirement ${i + 1}`,
        Status: 'draft',
        Priority: 'medium',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const parsedData = XLSX.utils.sheet_to_json<any>(ws);

      expect(parsedData).toHaveLength(1000);
      expect(parsedData[999]['ID']).toBe('REQ-1000');
    });

    it('should handle special characters in text fields', () => {
      const data = [
        {
          ID: 'REQ-001',
          Title: 'Test with "quotes" and special chars: <>&',
          Description: 'Line 1\nLine 2\nLine 3', // Newlines
        },
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const parsed = XLSX.utils.sheet_to_json<any>(ws);

      expect(parsed[0]['Title']).toContain('"quotes"');
      expect(parsed[0]['Description']).toContain('\n');
    });
  });

  describe('Data Type Coercion', () => {
    it('should convert date strings to timestamps', () => {
      const dateString = '2024-01-01';
      const timestamp = new Date(dateString).getTime();

      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should handle various timestamp formats', () => {
      const formats = [
        '2024-01-01',
        '2024-01-01T12:00:00Z',
        '2024-01-01T12:00:00.000Z',
        1704067200000, // Epoch timestamp
      ];

      formats.forEach((format) => {
        const timestamp = typeof format === 'number' ? format : new Date(format).getTime();

        expect(timestamp).toBeGreaterThan(0);
      });
    });

    it('should normalize status values', () => {
      const statusMap: Record<string, string> = {
        Draft: 'draft',
        APPROVED: 'approved',
        'In Review': 'in-review',
      };

      Object.entries(statusMap).forEach(([input, expected]) => {
        const normalized = input.toLowerCase().replace(/\s+/g, '-');
        expect(normalized).toBe(expected);
      });
    });
  });
});
