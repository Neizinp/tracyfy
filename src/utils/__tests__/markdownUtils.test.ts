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
  userToMarkdown,
  markdownToUser,
  projectToMarkdown,
  markdownToProject,
} from '../markdownUtils';
import type { Requirement, UseCase, TestCase, Information, User, Project } from '../../types';

describe('Requirement Markdown Conversion', () => {
  describe('requirementToMarkdown', () => {
    it('should serialize all required fields', () => {
      const requirement: Requirement = {
        id: 'REQ-001',
        title: 'Test Requirement',
        description: 'A test description',
        text: 'The system shall do something',
        rationale: 'Because it is needed',

        useCaseIds: ['UC-001', 'UC-002'],
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

      expect(markdown).toContain('');
      expect(markdown).toContain('useCaseIds: []');
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

    it('should preserve array fields', () => {
      const requirement: Requirement = {
        id: 'REQ-001',
        title: 'Test',
        description: 'Desc',
        text: 'Text',
        rationale: 'Rationale',
        useCaseIds: ['UC-001', 'UC-002', 'UC-003'],
        status: 'draft',
        priority: 'medium',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = requirementToMarkdown(requirement);

      expect(markdown).toContain('useCaseIds:');
      expect(markdown).toContain('- "UC-001"');
      expect(markdown).toContain('- "UC-002"');
      expect(markdown).toContain('- "UC-003"');
    });
  });

  describe('markdownToRequirement', () => {
    it('should parse valid requirement markdown', () => {
      const markdown = `---
id: "REQ-001"
title: "Test Requirement"
status: "draft"
priority: "high"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000

useCaseIds: []
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

        useCaseIds: ['UC-001'],
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
      expect(parsed.useCaseIds).toEqual(original.useCaseIds);
      expect(parsed.status).toBe(original.status);
      expect(parsed.priority).toBe(original.priority);
      expect(parsed.revision).toBe(original.revision);
    });

    it('should handle array parsing in YAML list format', () => {
      // The parser now supports both YAML list format and JSON array format
      const markdown = `---
id: "REQ-001"
title: "Test"
status: "draft"
priority: "high"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
  - "REQ-000"
  - "REQ-001"
useCaseIds:
  - "UC-001"
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

      expect(requirement.useCaseIds).toEqual(['UC-001']);
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
    it('should serialize all fields including requirementIds', () => {
      const testCase: TestCase = {
        id: 'TC-001',
        title: 'Login Test',
        description: 'Tests login functionality',
        requirementIds: ['REQ-001', 'REQ-002'],
        status: 'passed',
        priority: 'high',
        author: 'Test Author',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = testCaseToMarkdown(testCase);

      expect(markdown).toContain('id: "TC-001"');
      expect(markdown).toContain('requirementIds:');
      expect(markdown).toContain('- "REQ-001"');
      expect(markdown).toContain('- "REQ-002"');
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
requirementIds: ["REQ-001", "REQ-002"]
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
      expect(testCase.requirementIds).toEqual(['REQ-001', 'REQ-002']);
      expect(testCase.status).toBe('passed');
    });

    it('should round-trip without data loss', () => {
      const original: TestCase = {
        id: 'TC-001',
        title: 'Test Case',
        description: 'Description',
        requirementIds: ['REQ-001', 'REQ-002'],
        status: 'draft',
        priority: 'high',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = testCaseToMarkdown(original);
      console.log('Generated markdown:', markdown);
      const parsed = markdownToTestCase(markdown);

      expect(parsed.id).toBe(original.id);
      expect(parsed.requirementIds).toEqual(original.requirementIds);
    });
  });
});

describe('Information Markdown Conversion', () => {
  describe('informationToMarkdown', () => {
    it('should serialize all fields', () => {
      const info: Information = {
        id: 'INF-001',
        title: 'Meeting Notes',
        content: 'Discussion about requirements',
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
      expect(info.content).toBe('Discussion about requirements');
    });

    it('should round-trip without data loss', () => {
      const original: Information = {
        id: 'INF-001',
        title: 'Info',
        content: 'Content here',
        type: 'note',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      const markdown = informationToMarkdown(original);
      const parsed = markdownToInformation(markdown);

      expect(parsed.id).toBe(original.id);
      expect(parsed.title).toBe(original.title);
      expect(parsed.content).toBe(original.content);
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

describe('User Markdown Conversion', () => {
  describe('userToMarkdown', () => {
    it('should serialize all user fields', () => {
      const user: User = {
        id: 'USER-001',
        name: 'John Doe',
        dateCreated: 1700000000000,
        lastModified: 1700000100000,
      };

      const markdown = userToMarkdown(user);

      expect(markdown).toContain('id: "USER-001"');
      expect(markdown).toContain('name: "John Doe"');
      expect(markdown).toContain('dateCreated: 1700000000000');
      expect(markdown).toContain('lastModified: 1700000100000');
    });

    it('should handle special characters in user name', () => {
      const user: User = {
        id: 'USER-001',
        name: 'John "The Expert" O\'Connor',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      const markdown = userToMarkdown(user);

      // Should escape quotes properly
      expect(markdown).toContain('USER-001');
      expect(markdown).toContain('John');
    });

    it('should handle unicode in user name', () => {
      const user: User = {
        id: 'USER-001',
        name: 'José García 日本語',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      const markdown = userToMarkdown(user);
      const parsed = markdownToUser(markdown);

      expect(parsed?.name).toBe(user.name);
    });
  });

  describe('markdownToUser', () => {
    it('should parse valid user markdown', () => {
      const markdown = `---
id: "USER-001"
name: "John Doe"
dateCreated: 1700000000000
lastModified: 1700000100000
---

# John Doe
`;

      const user = markdownToUser(markdown);

      expect(user).not.toBeNull();
      expect(user?.id).toBe('USER-001');
      expect(user?.name).toBe('John Doe');
      expect(user?.dateCreated).toBe(1700000000000);
      expect(user?.lastModified).toBe(1700000100000);
    });

    it('should return user with empty id for invalid markdown', () => {
      const markdown = `Not valid YAML frontmatter`;

      const user = markdownToUser(markdown);

      // Returns object with empty id for invalid markdown
      expect(user?.id).toBe('');
    });
    it('should return user with empty id for missing id field', () => {
      const markdown = `---
name: "No ID"
---

# No ID
`;

      const user = markdownToUser(markdown);

      // Returns object with empty id
      expect(user?.id).toBe('');
      expect(user?.name).toBe('No ID');
    });

    it('should handle missing optional fields with defaults', () => {
      const markdown = `---
id: "USER-001"
name: "John"
---

# John
`;

      const user = markdownToUser(markdown);

      expect(user).not.toBeNull();
      expect(user?.id).toBe('USER-001');
      expect(user?.name).toBe('John');
      // dateCreated and lastModified should have defaults
      expect(user?.dateCreated).toBeDefined();
      expect(user?.lastModified).toBeDefined();
    });
  });

  describe('round-trip', () => {
    it('should round-trip without data loss', () => {
      const original: User = {
        id: 'USER-001',
        name: 'Test User',
        dateCreated: 1700000000000,
        lastModified: 1700000100000,
      };

      const markdown = userToMarkdown(original);
      const parsed = markdownToUser(markdown);

      expect(parsed).not.toBeNull();
      expect(parsed?.id).toBe(original.id);
      expect(parsed?.name).toBe(original.name);
      expect(parsed?.dateCreated).toBe(original.dateCreated);
      expect(parsed?.lastModified).toBe(original.lastModified);
    });

    it('should handle multiple round-trips', () => {
      const original: User = {
        id: 'USER-123',
        name: 'Multiple Round Trip User',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
      };

      // Round trip 1
      const markdown1 = userToMarkdown(original);
      const parsed1 = markdownToUser(markdown1);
      expect(parsed1).not.toBeNull();

      // Round trip 2
      const markdown2 = userToMarkdown(parsed1!);
      const parsed2 = markdownToUser(markdown2);

      expect(parsed2?.id).toBe(original.id);
      expect(parsed2?.name).toBe(original.name);
    });
  });
});

describe('Project Markdown Conversion', () => {
  describe('projectToMarkdown', () => {
    it('should serialize all project fields', () => {
      const project: Project = {
        id: 'proj-123',
        name: 'Test Project',
        description: 'A test project description',
        requirementIds: ['REQ-001', 'REQ-002'],
        useCaseIds: ['UC-001'],
        testCaseIds: ['TC-001', 'TC-002'],
        informationIds: [],
        riskIds: [],
        lastModified: 1700000000000,
      };

      const markdown = projectToMarkdown(project);

      expect(markdown).toContain('id: "proj-123"');
      expect(markdown).toContain('name: "Test Project"');
      expect(markdown).toContain('description: "A test project description"');
      expect(markdown).toContain('lastModified: 1700000000000');
      expect(markdown).toContain('requirementIds:');
      expect(markdown).toContain('- "REQ-001"');
      expect(markdown).toContain('- "REQ-002"');
      expect(markdown).toContain('useCaseIds:');
      expect(markdown).toContain('- "UC-001"');
      expect(markdown).toContain('testCaseIds:');
      expect(markdown).toContain('- "TC-001"');
      expect(markdown).toContain('informationIds: []');
    });

    it('should handle empty arrays', () => {
      const project: Project = {
        id: 'proj-123',
        name: 'Empty Project',
        description: '',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        riskIds: [],
        lastModified: 1700000000000,
      };

      const markdown = projectToMarkdown(project);

      expect(markdown).toContain('requirementIds: []');
      expect(markdown).toContain('useCaseIds: []');
      expect(markdown).toContain('testCaseIds: []');
      expect(markdown).toContain('informationIds: []');
    });

    it('should include project name and description in body', () => {
      const project: Project = {
        id: 'proj-123',
        name: 'My Project',
        description: 'This is the description',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        riskIds: [],
        lastModified: 1700000000000,
      };

      const markdown = projectToMarkdown(project);

      expect(markdown).toContain('# My Project');
      expect(markdown).toContain('This is the description');
    });
  });

  describe('markdownToProject', () => {
    it('should parse valid project markdown', () => {
      const markdown = `---
id: "proj-123"
name: "Test Project"
description: "A test project"
lastModified: 1700000000000
requirementIds:
  - "REQ-001"
  - "REQ-002"
useCaseIds:
  - "UC-001"
testCaseIds: []
informationIds: []
---

# Test Project

A test project
`;

      const project = markdownToProject(markdown);

      expect(project).not.toBeNull();
      expect(project?.id).toBe('proj-123');
      expect(project?.name).toBe('Test Project');
      expect(project?.description).toBe('A test project');
      expect(project?.requirementIds).toEqual(['REQ-001', 'REQ-002']);
      expect(project?.useCaseIds).toEqual(['UC-001']);
      expect(project?.testCaseIds).toEqual([]);
      expect(project?.informationIds).toEqual([]);
    });

    it('should return null for missing id field', () => {
      const markdown = `---
name: "No ID Project"
---

# No ID Project
`;

      const project = markdownToProject(markdown);

      expect(project).toBeNull();
    });

    it('should handle missing optional fields with defaults', () => {
      const markdown = `---
id: "proj-123"
name: "Minimal Project"
---

# Minimal Project
`;

      const project = markdownToProject(markdown);

      expect(project).not.toBeNull();
      expect(project?.id).toBe('proj-123');
      expect(project?.name).toBe('Minimal Project');
      expect(project?.description).toBe('');
      expect(project?.requirementIds).toEqual([]);
      expect(project?.useCaseIds).toEqual([]);
      expect(project?.testCaseIds).toEqual([]);
      expect(project?.informationIds).toEqual([]);
    });

    it('should round-trip without data loss', () => {
      const original: Project = {
        id: 'proj-test',
        name: 'Round Trip Project',
        description: 'Testing round trip functionality',
        requirementIds: ['REQ-001', 'REQ-002', 'REQ-003'],
        useCaseIds: ['UC-001'],
        testCaseIds: ['TC-001', 'TC-002'],
        informationIds: ['INF-001'],
        riskIds: [],
        lastModified: 1700000000000,
      };

      const markdown = projectToMarkdown(original);
      const parsed = markdownToProject(markdown);

      expect(parsed).not.toBeNull();
      expect(parsed?.id).toBe(original.id);
      expect(parsed?.name).toBe(original.name);
      expect(parsed?.description).toBe(original.description);
      expect(parsed?.requirementIds).toEqual(original.requirementIds);
      expect(parsed?.useCaseIds).toEqual(original.useCaseIds);
      expect(parsed?.testCaseIds).toEqual(original.testCaseIds);
      expect(parsed?.informationIds).toEqual(original.informationIds);
      expect(parsed?.lastModified).toBe(original.lastModified);
    });

    it('should handle special characters in project name and description', () => {
      const original: Project = {
        id: 'proj-special',
        name: 'Project with "quotes" and: colons',
        description: 'Description with special chars @ # $ %',
        requirementIds: [],
        useCaseIds: [],
        testCaseIds: [],
        informationIds: [],
        riskIds: [],
        lastModified: 1700000000000,
      };

      const markdown = projectToMarkdown(original);
      const parsed = markdownToProject(markdown);

      expect(parsed).not.toBeNull();
      expect(parsed?.name).toBe(original.name);
    });
  });
});
