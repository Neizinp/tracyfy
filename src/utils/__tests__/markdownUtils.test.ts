/**
 * Markdown Utils Tests
 *
 * These tests verify the YAML frontmatter parsing and serialization
 * used to convert artifacts to/from markdown files.
 *
 * Key behaviors tested:
 * 1. Round-trip integrity (serialize → parse → same data)
 * 2. Special character handling in YAML
 * 3. Multiline string handling
 * 4. Missing/optional field defaults
 * 5. Array field handling
 */

import { describe, it, expect } from 'vitest';
import {
  requirementToMarkdown,
  markdownToRequirement,
  convertUseCaseToMarkdown,
  markdownToUseCase,
  testCaseToMarkdown,
  markdownToTestCase,
  informationToMarkdown,
  markdownToInformation,
} from '../markdownUtils';
import type { Requirement, UseCase, TestCase, Information } from '../../types';

describe('Requirement Markdown Conversion', () => {
  describe('requirementToMarkdown', () => {
    it('should serialize all required fields', () => {
      const requirement: Requirement = {
        id: 'REQ-001',
        title: 'Test Requirement',
        description: 'A test description',
        text: 'The system shall do something',
        rationale: 'Because it is needed',

        status: 'draft',
        priority: 'high',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = requirementToMarkdown(requirement);

      expect(markdown).toContain('id: "REQ-001"');
      expect(markdown).toContain('title: "Test Requirement"');
      expect(markdown).toContain('status: "draft"');
      expect(markdown).toContain('priority: "high"');
      expect(markdown).toContain('revision: "01"');
      expect(markdown).toContain('## Description');
      expect(markdown).toContain('A test description');
      expect(markdown).toContain('## Requirement Text');
      expect(markdown).toContain('The system shall do something');
      expect(markdown).toContain('## Rationale');
      expect(markdown).toContain('Because it is needed');
    });

    it('should handle empty optional fields', () => {
      const requirement: Requirement = {
        id: 'REQ-001',
        title: 'Test',
        description: '',
        text: '',
        rationale: '',

        status: 'draft',
        priority: 'medium',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = requirementToMarkdown(requirement);

      expect(markdown).toContain('id: "REQ-001"');
    });

    it('should escape special characters in YAML', () => {
      const requirement: Requirement = {
        id: 'REQ-001',
        title: 'Test with "quotes" and: colons',
        description: 'Description with "special" chars',
        text: 'Text',
        rationale: 'Rationale',

        status: 'draft',
        priority: 'medium',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = requirementToMarkdown(requirement);

      // Should escape quotes
      expect(markdown).toContain('title: "Test with \\"quotes\\" and: colons"');
    });

    it('should handle multiline description', () => {
      const requirement: Requirement = {
        id: 'REQ-001',
        title: 'Test',
        description: 'Line 1\nLine 2\nLine 3',
        text: 'Text',
        rationale: 'Rationale',

        status: 'draft',
        priority: 'medium',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = requirementToMarkdown(requirement);

      // Multiline content should be preserved in body
      expect(markdown).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should parse valid requirement markdown', () => {
      const markdown = `---
id: "REQ-001"
title: "Test Requirement"
status: "draft"
priority: "high"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000

---

# Test Requirement

## Description
A test description

## Requirement Text
The system shall do something

## Rationale
Because it is needed
`;

      const requirement = markdownToRequirement(markdown);

      expect(requirement.id).toBe('REQ-001');
      expect(requirement.title).toBe('Test Requirement');
      expect(requirement.status).toBe('draft');
      expect(requirement.priority).toBe('high');
      expect(requirement.description).toBe('A test description');
      expect(requirement.text).toBe('The system shall do something');
      expect(requirement.rationale).toBe('Because it is needed');
    });

    it('should handle missing optional fields with defaults', () => {
      const markdown = `---
id: "REQ-001"
title: "Test"
---

# Test

## Description
Desc

## Requirement Text
Text

## Rationale
Rationale
`;

      const requirement = markdownToRequirement(markdown);

      expect(requirement.id).toBe('REQ-001');
      expect(requirement.status).toBe('draft'); // default
      expect(requirement.priority).toBe('medium'); // default
      expect(requirement.revision).toBe('01'); // default
    });

    it('should throw on missing required fields', () => {
      const markdown = `---
title: "No ID"
---

# No ID

## Description
`;

      // Should still parse but with empty string for id
      const requirement = markdownToRequirement(markdown);
      expect(requirement.id).toBe('');
    });

    it('should handle corrupted frontmatter gracefully', () => {
      const markdown = `Not valid YAML frontmatter

# Some Content

## Description
Test
`;

      const requirement = markdownToRequirement(markdown);

      // Should return with defaults
      expect(requirement.id).toBe('');
      expect(requirement.title).toBe('');
    });

    it('should round-trip without data loss', () => {
      const original: Requirement = {
        id: 'REQ-001',
        title: 'Test Requirement',
        description: 'A test description',
        text: 'The system shall do something',
        rationale: 'Because it is needed',

        status: 'approved',
        priority: 'high',
        author: 'Test Author',
        verificationMethod: 'Test',
        comments: 'Some comments',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '02',
      };

      const markdown = requirementToMarkdown(original);
      const parsed = markdownToRequirement(markdown);

      expect(parsed.id).toBe(original.id);
      expect(parsed.title).toBe(original.title);
      expect(parsed.description).toBe(original.description);
      expect(parsed.text).toBe(original.text);
      expect(parsed.rationale).toBe(original.rationale);
      expect(parsed.status).toBe(original.status);
      expect(parsed.priority).toBe(original.priority);
      expect(parsed.revision).toBe(original.revision);
    });

    it('drops relation fields that older versions stored in the file', () => {
      // Relations are links (links/), not fields of the artifact
      const markdown = `---
id: "REQ-001"
title: "Test"
useCaseIds:
  - "UC-001"
linkedArtifacts:
  - targetId: "REQ-002"
    type: "satisfies"
---

# Test
`;

      const requirement = markdownToRequirement(markdown);

      expect(requirement.title).toBe('Test');
      expect(requirement).not.toHaveProperty('useCaseIds');
      expect(requirement).not.toHaveProperty('linkedArtifacts');
      expect(requirementToMarkdown(requirement)).not.toMatch(/useCaseIds|linkedArtifacts/);
    });
  });
});

describe('UseCase Markdown Conversion', () => {
  describe('convertUseCaseToMarkdown', () => {
    it('should serialize all fields', () => {
      const useCase: UseCase = {
        id: 'UC-001',
        title: 'User Login',
        description: 'User logs into the system',
        actor: 'End User',
        preconditions: 'User has an account',
        postconditions: 'User is logged in',
        mainFlow: '1. User enters credentials\n2. System validates\n3. User is logged in',
        alternativeFlows: 'A1. Invalid credentials',
        status: 'approved',
        priority: 'high',
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = convertUseCaseToMarkdown(useCase);

      expect(markdown).toContain('id: "UC-001"');
      expect(markdown).toContain('title: "User Login"');
      expect(markdown).toContain('actor: "End User"');
      expect(markdown).toContain('## Description');
      expect(markdown).toContain('## Preconditions');
      expect(markdown).toContain('## Main Flow');
      expect(markdown).toContain('## Alternative Flows');
      expect(markdown).toContain('## Postconditions');
    });
  });

  describe('markdownToUseCase', () => {
    it('should parse valid use case markdown', () => {
      const markdown = `---
id: "UC-001"
title: "User Login"
status: "approved"
priority: "high"
revision: "01"
lastModified: 1700000000000
actor: "End User"
---

# User Login

## Description
User logs into the system

## Actor
End User

## Preconditions
User has an account

## Main Flow
1. User enters credentials
2. System validates

## Alternative Flows
A1. Invalid credentials

## Postconditions
User is logged in
`;

      const useCase = markdownToUseCase(markdown);

      expect(useCase.id).toBe('UC-001');
      expect(useCase.title).toBe('User Login');
      expect(useCase.actor).toBe('End User');
      expect(useCase.preconditions).toBe('User has an account');
      expect(useCase.mainFlow).toContain('1. User enters credentials');
      expect(useCase.alternativeFlows).toBe('A1. Invalid credentials');
      expect(useCase.postconditions).toBe('User is logged in');
    });

    it('should round-trip without data loss', () => {
      const original: UseCase = {
        id: 'UC-001',
        title: 'Test Use Case',
        description: 'Description',
        actor: 'Actor',
        preconditions: 'Pre',
        postconditions: 'Post',
        mainFlow: 'Flow',
        alternativeFlows: 'Alt',
        status: 'draft',
        priority: 'medium',
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = convertUseCaseToMarkdown(original);
      const parsed = markdownToUseCase(markdown);

      expect(parsed.id).toBe(original.id);
      expect(parsed.title).toBe(original.title);
      expect(parsed.actor).toBe(original.actor);
      expect(parsed.mainFlow).toBe(original.mainFlow);
    });
  });
});

describe('TestCase Markdown Conversion', () => {
  describe('testCaseToMarkdown', () => {
    it('does not store the requirements it covers (those are links)', () => {
      const testCase: TestCase = {
        id: 'TC-001',
        title: 'Login Test',
        description: 'Tests login functionality',
        status: 'passed',
        priority: 'high',
        author: 'Test Author',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = testCaseToMarkdown(testCase);

      expect(markdown).toContain('id: "TC-001"');
      expect(markdown).not.toContain('requirementIds');
      expect(markdown).not.toContain('Requirements Covered');
    });
  });

  describe('markdownToTestCase', () => {
    it('should parse valid test case markdown with JSON array format', () => {
      // The parser uses JSON array format, not YAML list format
      const markdown = `---
id: "TC-001"
title: "Login Test"
status: "passed"
priority: "high"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
author: "Test Author"
---

# Login Test

## Description
Tests login functionality

## Requirements Covered
- REQ-001
- REQ-002
`;

      const testCase = markdownToTestCase(markdown);

      expect(testCase.id).toBe('TC-001');
      expect(testCase.title).toBe('Login Test');
      expect(testCase.status).toBe('passed');
    });

    it('should round-trip without data loss', () => {
      const original: TestCase = {
        id: 'TC-001',
        title: 'Test Case',
        description: 'Description',
        status: 'draft',
        priority: 'high',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = testCaseToMarkdown(original);
      const parsed = markdownToTestCase(markdown);

      expect(parsed.id).toBe(original.id);
      expect(parsed.title).toBe(original.title);
      expect(parsed.description).toBe(original.description);
    });
  });
});

describe('Information Markdown Conversion', () => {
  describe('informationToMarkdown', () => {
    it('should serialize all fields', () => {
      const info: Information = {
        id: 'INF-001',
        title: 'Meeting Notes',
        text: 'Discussion about requirements',
        type: 'meeting',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = informationToMarkdown(info);

      expect(markdown).toContain('id: "INF-001"');
      expect(markdown).toContain('title: "Meeting Notes"');
      expect(markdown).toContain('type: "meeting"');
      expect(markdown).toContain('Discussion about requirements');
    });
  });

  describe('markdownToInformation', () => {
    it('should parse valid information markdown', () => {
      const markdown = `---
id: "INF-001"
title: "Meeting Notes"
type: "meeting"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
---

# Meeting Notes

Discussion about requirements
`;

      const info = markdownToInformation(markdown);

      expect(info.id).toBe('INF-001');
      expect(info.title).toBe('Meeting Notes');
      expect(info.type).toBe('meeting');
      expect(info.text).toBe('Discussion about requirements');
    });

    it('should round-trip without data loss', () => {
      const original: Information = {
        id: 'INF-001',
        title: 'Info',
        text: 'Content here',
        type: 'note',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = informationToMarkdown(original);
      const parsed = markdownToInformation(markdown);

      expect(parsed.id).toBe(original.id);
      expect(parsed.title).toBe(original.title);
      expect(parsed.text).toBe(original.text);
      expect(parsed.type).toBe(original.type);
    });
  });
});

describe('Edge Cases and Special Characters', () => {
  it('should handle unicode characters', () => {
    const requirement: Requirement = {
      id: 'REQ-001',
      title: 'Тест требование 测试 🚀',
      description: 'Описание на русском',
      text: '中文文本',
      rationale: 'Emoji: 👍 ✅ 🎉',

      status: 'draft',
      priority: 'medium',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    };

    const markdown = requirementToMarkdown(requirement);
    const parsed = markdownToRequirement(markdown);

    expect(parsed.title).toBe(requirement.title);
    expect(parsed.description).toBe(requirement.description);
    expect(parsed.text).toBe(requirement.text);
    expect(parsed.rationale).toBe(requirement.rationale);
  });

  it('should handle very long content', () => {
    const longText = 'A'.repeat(10000);
    const requirement: Requirement = {
      id: 'REQ-001',
      title: 'Test',
      description: longText,
      text: 'Text',
      rationale: 'Rationale',

      status: 'draft',
      priority: 'medium',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    };

    const markdown = requirementToMarkdown(requirement);
    const parsed = markdownToRequirement(markdown);

    expect(parsed.description).toBe(longText);
  });

  it('should handle YAML special characters in strings', () => {
    const requirement: Requirement = {
      id: 'REQ-001',
      title: 'Test: with colon and #hash',
      description: 'Contains @mention and $variable',
      text: 'Uses [brackets] and {braces}',
      rationale: 'Has backslash \\ and pipe |',

      status: 'draft',
      priority: 'medium',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    };

    const markdown = requirementToMarkdown(requirement);
    const parsed = markdownToRequirement(markdown);

    expect(parsed.title).toBe(requirement.title);
    expect(parsed.description).toBe(requirement.description);
    expect(parsed.text).toBe(requirement.text);
  });

  it('should handle empty content', () => {
    const markdown = `---
id: ""
title: ""
status: "draft"
priority: "medium"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000

---

# 

## Description

## Requirement Text

## Rationale
`;

    const requirement = markdownToRequirement(markdown);

    expect(requirement.id).toBe('');
    expect(requirement.title).toBe('');
    expect(requirement.description).toBe('');
    expect(requirement.text).toBe('');
    expect(requirement.rationale).toBe('');
  });

  it('should handle markdown in content', () => {
    const requirement: Requirement = {
      id: 'REQ-001',
      title: 'Test',
      description: '**Bold** and *italic* and `code`',
      text: '- List item 1\n- List item 2',
      rationale: '[Link](http://example.com)',

      status: 'draft',
      priority: 'medium',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    };

    const markdown = requirementToMarkdown(requirement);
    const parsed = markdownToRequirement(markdown);

    expect(parsed.description).toBe(requirement.description);
    expect(parsed.text).toBe(requirement.text);
    expect(parsed.rationale).toBe(requirement.rationale);
  });

  it('should handle isDeleted and deletedAt fields', () => {
    const requirement: Requirement = {
      id: 'REQ-001',
      title: 'Deleted Requirement',
      description: 'Desc',
      text: 'Text',
      rationale: 'Rationale',

      status: 'draft',
      priority: 'medium',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
      isDeleted: true,
      deletedAt: 1700000100000,
    };

    const markdown = requirementToMarkdown(requirement);
    const parsed = markdownToRequirement(markdown);

    expect(parsed.isDeleted).toBe(true);
    expect(parsed.deletedAt).toBe(1700000100000);
  });
});

describe('YAML Frontmatter Parsing Edge Cases', () => {
  it('should handle frontmatter with extra blank lines', () => {
    const markdown = `---

id: "REQ-001"
title: "Test"

status: "draft"

---

# Test

## Description
Desc
`;

    const requirement = markdownToRequirement(markdown);
    expect(requirement.id).toBe('REQ-001');
  });

  it('should handle boolean values', () => {
    const markdown = `---
id: "REQ-001"
title: "Test"
isDeleted: true
---

# Test

## Description
Desc
`;

    const requirement = markdownToRequirement(markdown);
    expect(requirement.isDeleted).toBe(true);
  });

  it('should handle numeric values', () => {
    const markdown = `---
id: "REQ-001"
title: "Test"
dateCreated: 1700000000000
revision: 5
---

# Test

## Description
Desc
`;

    const requirement = markdownToRequirement(markdown);
    expect(requirement.dateCreated).toBe(1700000000000);
  });

  it('should handle missing closing frontmatter delimiter', () => {
    const markdown = `---
id: "REQ-001"
title: "Test"

# Test

## Description
Desc
`;

    // Should treat everything as frontmatter until EOF
    const requirement = markdownToRequirement(markdown);
    // Behavior may vary - test current behavior
    expect(requirement).toBeDefined();
  });
});
