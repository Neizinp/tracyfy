/**
 * Link Markdown Utilities Tests
 *
 * Tests for converting Link objects to/from Markdown files with YAML frontmatter.
 */

import { describe, it, expect } from 'vitest';
import { linkToMarkdown, parseMarkdownLink, generateLinkId } from '../linkMarkdownUtils';
import type { Link } from '../../types';

describe('linkMarkdownUtils', () => {
  describe('linkToMarkdown', () => {
    it('should convert a global link to markdown with YAML frontmatter', () => {
      const link: Link = {
        id: 'LINK-001',
        sourceId: 'REQ-001',
        targetId: 'UC-001',
        type: 'satisfies',
        projectIds: [],
        dateCreated: 1700000000000,
        lastModified: 1700000100000,
      };

      const markdown = linkToMarkdown(link);

      expect(markdown).toContain('---');
      expect(markdown).toContain('id: LINK-001');
      expect(markdown).toContain('sourceId: REQ-001');
      expect(markdown).toContain('targetId: UC-001');
      expect(markdown).toContain('type: satisfies');
      expect(markdown).toContain('projectIds: ');
      expect(markdown).toContain('dateCreated: 1700000000000');
      expect(markdown).toContain('lastModified: 1700000100000');
    });

    it('should include project IDs for project-scoped links', () => {
      const link: Link = {
        id: 'LINK-002',
        sourceId: 'REQ-001',
        targetId: 'TC-001',
        type: 'verifies',
        projectIds: ['PRJ-001', 'PRJ-002'],
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      const markdown = linkToMarkdown(link);

      expect(markdown).toContain('projectIds: PRJ-001, PRJ-002');
    });

    it('should include human-readable content in body', () => {
      const link: Link = {
        id: 'LINK-001',
        sourceId: 'REQ-001',
        targetId: 'UC-001',
        type: 'satisfies',
        projectIds: [],
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      const markdown = linkToMarkdown(link);

      expect(markdown).toContain('# LINK-001');
      expect(markdown).toContain('**REQ-001**');
      expect(markdown).toContain('**UC-001**');
      expect(markdown).toContain('satisfies');
    });

    it('should indicate global scope in body for global links', () => {
      const link: Link = {
        id: 'LINK-001',
        sourceId: 'REQ-001',
        targetId: 'UC-001',
        type: 'satisfies',
        projectIds: [],
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      const markdown = linkToMarkdown(link);

      expect(markdown).toContain('Global (all projects)');
    });

    it('should list project scope in body for project-scoped links', () => {
      const link: Link = {
        id: 'LINK-001',
        sourceId: 'REQ-001',
        targetId: 'UC-001',
        type: 'satisfies',
        projectIds: ['PRJ-001'],
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      const markdown = linkToMarkdown(link);

      expect(markdown).toContain('**Scope:** PRJ-001');
    });
  });

  describe('parseMarkdownLink', () => {
    it('should parse a valid markdown link file', () => {
      const content = `---
id: LINK-001
sourceId: REQ-001
targetId: UC-001
type: satisfies
projectIds: 
dateCreated: 1700000000000
lastModified: 1700000100000
---

# LINK-001

Links **REQ-001** to **UC-001** (satisfies)
`;

      const link = parseMarkdownLink(content);

      expect(link).not.toBeNull();
      expect(link!.id).toBe('LINK-001');
      expect(link!.sourceId).toBe('REQ-001');
      expect(link!.targetId).toBe('UC-001');
      expect(link!.type).toBe('satisfies');
      expect(link!.projectIds).toEqual([]);
      expect(link!.dateCreated).toBe(1700000000000);
      expect(link!.lastModified).toBe(1700000100000);
    });

    it('should parse project-scoped links correctly', () => {
      const content = `---
id: LINK-002
sourceId: REQ-002
targetId: TC-001
type: verifies
projectIds: PRJ-001, PRJ-002
dateCreated: 1700000000000
lastModified: 1700000000000
---

# LINK-002
`;

      const link = parseMarkdownLink(content);

      expect(link).not.toBeNull();
      expect(link!.projectIds).toEqual(['PRJ-001', 'PRJ-002']);
    });

    it('should return null for content without frontmatter', () => {
      const content = '# Just some markdown content';

      const link = parseMarkdownLink(content);

      expect(link).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const content = `---
id: LINK-001
sourceId: REQ-001
---

# Incomplete
`;

      const link = parseMarkdownLink(content);

      expect(link).toBeNull();
    });

    it('should handle missing dateCreated with default', () => {
      const content = `---
id: LINK-001
sourceId: REQ-001
targetId: UC-001
type: satisfies
projectIds: 
---

# LINK-001
`;

      const link = parseMarkdownLink(content);

      expect(link).not.toBeNull();
      expect(typeof link!.dateCreated).toBe('number');
    });

    it('should handle different link types', () => {
      const types = [
        'parent',
        'derived_from',
        'depends_on',
        'conflicts_with',
        'duplicates',
        'refines',
        'satisfies',
        'verifies',
        'constrains',
        'requires',
        'related_to',
      ];

      types.forEach((type) => {
        const content = `---
id: LINK-001
sourceId: REQ-001
targetId: UC-001
type: ${type}
projectIds: 
dateCreated: 1700000000000
lastModified: 1700000000000
---
`;

        const link = parseMarkdownLink(content);
        expect(link).not.toBeNull();
        expect(link!.type).toBe(type);
      });
    });

    it('should trim whitespace from project IDs', () => {
      const content = `---
id: LINK-001
sourceId: REQ-001
targetId: UC-001
type: satisfies
projectIds:   PRJ-001  ,  PRJ-002  
dateCreated: 1700000000000
lastModified: 1700000000000
---
`;

      const link = parseMarkdownLink(content);

      expect(link!.projectIds).toEqual(['PRJ-001', 'PRJ-002']);
    });
  });

  describe('generateLinkId', () => {
    it('should generate LINK-001 for empty array', () => {
      const id = generateLinkId([]);
      expect(id).toBe('LINK-001');
    });

    it('should increment from highest existing ID', () => {
      const existingIds = ['LINK-001', 'LINK-005', 'LINK-003'];
      const id = generateLinkId(existingIds);
      expect(id).toBe('LINK-006');
    });

    it('should pad ID to 3 digits', () => {
      const existingIds = ['LINK-001'];
      const id = generateLinkId(existingIds);
      expect(id).toBe('LINK-002');
    });

    it('should handle IDs with more than 3 digits', () => {
      const existingIds = ['LINK-999'];
      const id = generateLinkId(existingIds);
      expect(id).toBe('LINK-1000');
    });

    it('should ignore malformed IDs', () => {
      const existingIds = ['LINK-001', 'invalid', 'LINK-abc', 'LINK'];
      const id = generateLinkId(existingIds);
      expect(id).toBe('LINK-002');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve all data through markdown round-trip', () => {
      const original: Link = {
        id: 'LINK-042',
        sourceId: 'REQ-123',
        targetId: 'TC-456',
        type: 'verifies',
        projectIds: ['PRJ-001', 'PRJ-002'],
        dateCreated: 1700000000000,
        lastModified: 1700000100000,
      };

      const markdown = linkToMarkdown(original);
      const parsed = parseMarkdownLink(markdown);

      expect(parsed).not.toBeNull();
      expect(parsed!.id).toBe(original.id);
      expect(parsed!.sourceId).toBe(original.sourceId);
      expect(parsed!.targetId).toBe(original.targetId);
      expect(parsed!.type).toBe(original.type);
      expect(parsed!.projectIds).toEqual(original.projectIds);
      expect(parsed!.dateCreated).toBe(original.dateCreated);
      expect(parsed!.lastModified).toBe(original.lastModified);
    });

    it('should preserve global links through round-trip', () => {
      const original: Link = {
        id: 'LINK-001',
        sourceId: 'REQ-001',
        targetId: 'UC-001',
        type: 'satisfies',
        projectIds: [],
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      const markdown = linkToMarkdown(original);
      const parsed = parseMarkdownLink(markdown);

      expect(parsed!.projectIds).toEqual([]);
    });
  });
});
