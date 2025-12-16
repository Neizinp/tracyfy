import type { Requirement, UseCase, TestCase, Information, User, Project, Risk } from '../types';
import type { CustomAttributeDefinition, CustomAttributeValue } from '../types/customAttributes';

/**
 * Filter out corrupted custom attribute values (strings like "[object Object]")
 * that may have been saved due to previous serialization bugs
 */
function filterValidCustomAttributes(
  attrs: CustomAttributeValue[] | undefined
): CustomAttributeValue[] {
  return (attrs || []).filter(
    (attr): attr is CustomAttributeValue =>
      typeof attr === 'object' && attr !== null && 'attributeId' in attr
  );
}

/**
 * Convert a JavaScript object to YAML frontmatter string
 */
function objectToYaml(obj: Record<string, any>): string {
  const lines: string[] = ['---'];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'string') {
      // Escape quotes and handle multiline strings
      if (value.includes('\n')) {
        lines.push(`${key}: |`);
        value.split('\n').forEach((line) => lines.push(`  ${line}`));
      } else {
        const escaped = value.replace(/"/g, '\\"');
        lines.push(`${key}: "${escaped}"`);
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        value.forEach((item) => {
          if (typeof item === 'string') {
            lines.push(`  - "${item}"`);
          } else if (typeof item === 'object' && item !== null) {
            // Serialize objects as JSON for proper storage
            lines.push(`  - ${JSON.stringify(item)}`);
          } else {
            lines.push(`  - ${item}`);
          }
        });
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'object') {
      // Nested object - simple representation
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseYamlFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const lines = content.split('\n');

  if (lines[0] !== '---') {
    return { frontmatter: {}, body: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const bodyLines = lines.slice(endIndex + 1);

  const frontmatter: Record<string, any> = {};
  let currentKey: string | null = null;
  let currentMultiline: string[] = [];
  let isMultiline = false;
  let isArrayList = false;
  let currentArray: any[] = [];

  for (const line of frontmatterLines) {
    if (line.trim() === '') continue;

    // Handle YAML array list items (  - "value" or   - value or   - {json})
    if (isArrayList) {
      if (line.startsWith('  - ')) {
        const itemValue = line.substring(4).trim();
        // Parse the array item value
        if (itemValue.startsWith('"') && itemValue.endsWith('"')) {
          currentArray.push(itemValue.slice(1, -1).replace(/\\"/g, '"'));
        } else if (itemValue.startsWith('{') && itemValue.endsWith('}')) {
          // Parse JSON object
          try {
            currentArray.push(JSON.parse(itemValue));
          } catch {
            currentArray.push(itemValue);
          }
        } else if (itemValue === 'true' || itemValue === 'false') {
          currentArray.push(itemValue === 'true');
        } else if (!isNaN(Number(itemValue)) && itemValue !== '') {
          currentArray.push(Number(itemValue));
        } else {
          currentArray.push(itemValue);
        }
        continue;
      } else {
        // End of array list
        if (currentKey) {
          frontmatter[currentKey] = currentArray;
        }
        currentKey = null;
        currentArray = [];
        isArrayList = false;
      }
    }

    if (isMultiline) {
      if (line.startsWith('  ')) {
        currentMultiline.push(line.substring(2));
        continue;
      } else {
        // End of multiline
        if (currentKey) {
          frontmatter[currentKey] = currentMultiline.join('\n');
        }
        currentKey = null;
        currentMultiline = [];
        isMultiline = false;
      }
    }

    if (!isMultiline && !isArrayList) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (value === '|') {
        // Start of multiline string
        currentKey = key;
        isMultiline = true;
        currentMultiline = [];
      } else if (value === '') {
        // Could be start of YAML array list (key with no value)
        currentKey = key;
        isArrayList = true;
        currentArray = [];
      } else if (value === '[]') {
        frontmatter[key] = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Array in JSON format
        try {
          frontmatter[key] = JSON.parse(value);
        } catch {
          frontmatter[key] = value;
        }
      } else if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '') {
        frontmatter[key] = Number(value);
      } else if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        // Remove both double and single quotes around the value
        frontmatter[key] = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
      } else if (value.startsWith('{') && value.endsWith('}')) {
        // Object in JSON format
        try {
          frontmatter[key] = JSON.parse(value);
        } catch {
          frontmatter[key] = value;
        }
      } else {
        frontmatter[key] = value;
      }
    }
  }

  // Handle final multiline/array if still open
  if (isMultiline && currentKey) {
    frontmatter[currentKey] = currentMultiline.join('\n');
  }
  if (isArrayList && currentKey) {
    frontmatter[currentKey] = currentArray;
  }

  return {
    frontmatter,
    body: bodyLines.join('\n').trim(),
  };
}

/**
 * Convert a Requirement to Markdown with YAML frontmatter
 */
export function requirementToMarkdown(requirement: Requirement): string {
  const frontmatter = {
    id: requirement.id,
    title: requirement.title,
    status: requirement.status,
    priority: requirement.priority,
    revision: requirement.revision,
    dateCreated: requirement.dateCreated,
    lastModified: requirement.lastModified,

    useCaseIds: requirement.useCaseIds || [],
    linkedArtifacts: requirement.linkedArtifacts || [],
    author: requirement.author || '',
    verificationMethod: requirement.verificationMethod || '',
    approvalDate: requirement.approvalDate || null,
    isDeleted: requirement.isDeleted || false,
    deletedAt: requirement.deletedAt || null,
    customAttributes: filterValidCustomAttributes(requirement.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${requirement.title}

## Description
${requirement.description}

## Requirement Text
${requirement.text}

## Rationale
${requirement.rationale}

${requirement.comments ? `## Comments\n${requirement.comments}` : ''}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into a Requirement object
 */
export function markdownToRequirement(markdown: string): Requirement {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  // Extract content sections from body
  const sections: Record<string, string> = {};
  const lines = body.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.substring(3).trim();
      currentContent = [];
    } else if (line.startsWith('# ')) {
      // Skip main title
      continue;
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return {
    id: frontmatter.id || '',
    title: frontmatter.title || '',
    description: sections['Description'] || '',
    text: sections['Requirement Text'] || '',
    rationale: sections['Rationale'] || '',

    useCaseIds: frontmatter.useCaseIds || [],
    linkedArtifacts: frontmatter.linkedArtifacts || [],
    status: frontmatter.status || 'draft',
    priority: frontmatter.priority || 'medium',
    author: frontmatter.author || undefined,
    verificationMethod: frontmatter.verificationMethod || undefined,
    comments: sections['Comments'] || undefined,
    dateCreated: frontmatter.dateCreated || Date.now(),
    approvalDate: frontmatter.approvalDate || undefined,
    lastModified: frontmatter.lastModified || Date.now(),
    isDeleted: frontmatter.isDeleted || false,
    deletedAt: frontmatter.deletedAt || undefined,
    revision: frontmatter.revision || '01',
    customAttributes: frontmatter.customAttributes || [],
  };
}

/**
 * Convert a Use Case to Markdown with YAML frontmatter
 */
export function convertUseCaseToMarkdown(useCase: UseCase): string {
  const frontmatter = {
    id: useCase.id,
    title: useCase.title,
    status: useCase.status,
    priority: useCase.priority,
    revision: useCase.revision,
    lastModified: useCase.lastModified,
    actor: useCase.actor,
    linkedArtifacts: useCase.linkedArtifacts || [],
    isDeleted: useCase.isDeleted || false,
    deletedAt: useCase.deletedAt || null,
    customAttributes: filterValidCustomAttributes(useCase.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${useCase.title}

## Description
${useCase.description}

## Actor
${useCase.actor}

## Preconditions
${useCase.preconditions}

## Main Flow
${useCase.mainFlow}

${useCase.alternativeFlows ? `## Alternative Flows\n${useCase.alternativeFlows}` : ''}

## Postconditions
${useCase.postconditions}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into a Use Case object
 */
export function markdownToUseCase(markdown: string): UseCase {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  const sections: Record<string, string> = {};
  const lines = body.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.substring(3).trim();
      currentContent = [];
    } else if (line.startsWith('# ')) {
      continue;
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return {
    id: frontmatter.id || '',
    title: frontmatter.title || '',
    description: sections['Description'] || '',
    actor: sections['Actor'] || frontmatter.actor || '',
    preconditions: sections['Preconditions'] || '',
    postconditions: sections['Postconditions'] || '',
    mainFlow: sections['Main Flow'] || '',
    alternativeFlows: sections['Alternative Flows'] || undefined,
    priority: frontmatter.priority || 'medium',
    status: frontmatter.status || 'draft',
    lastModified: frontmatter.lastModified || Date.now(),
    linkedArtifacts: frontmatter.linkedArtifacts || [],
    isDeleted: frontmatter.isDeleted || false,
    deletedAt: frontmatter.deletedAt || undefined,
    revision: frontmatter.revision || '01',
    customAttributes: frontmatter.customAttributes || [],
  };
}

/**
 * Convert a Test Case to Markdown with YAML frontmatter
 */
export function testCaseToMarkdown(testCase: TestCase): string {
  const frontmatter = {
    id: testCase.id,
    title: testCase.title,
    status: testCase.status,
    priority: testCase.priority,
    revision: testCase.revision,
    dateCreated: testCase.dateCreated,
    lastModified: testCase.lastModified,
    requirementIds: testCase.requirementIds,
    author: testCase.author || '',
    lastRun: testCase.lastRun || null,
    linkedArtifacts: testCase.linkedArtifacts || [],
    isDeleted: testCase.isDeleted || false,
    deletedAt: testCase.deletedAt || null,
    customAttributes: filterValidCustomAttributes(testCase.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${testCase.title}

## Description
${testCase.description}

## Requirements Covered
${testCase.requirementIds.map((id) => `- ${id}`).join('\n')}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into a Test Case object
 */
export function markdownToTestCase(markdown: string): TestCase {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  const sections: Record<string, string> = {};
  const lines = body.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.substring(3).trim();
      currentContent = [];
    } else if (line.startsWith('# ')) {
      continue;
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return {
    id: frontmatter.id || '',
    title: frontmatter.title || '',
    description: sections['Description'] || '',
    requirementIds: frontmatter.requirementIds || [],
    status: frontmatter.status || 'draft',
    priority: frontmatter.priority || 'medium',
    author: frontmatter.author || undefined,
    lastRun: frontmatter.lastRun || undefined,
    dateCreated: frontmatter.dateCreated || Date.now(),
    lastModified: frontmatter.lastModified || Date.now(),
    linkedArtifacts: frontmatter.linkedArtifacts || [],
    isDeleted: frontmatter.isDeleted || false,
    deletedAt: frontmatter.deletedAt || undefined,
    revision: frontmatter.revision || '01',
    customAttributes: frontmatter.customAttributes || [],
  };
}

/**
 * Convert an Information item to Markdown with YAML frontmatter
 */
export function informationToMarkdown(information: Information): string {
  const frontmatter = {
    id: information.id,
    title: information.title,
    type: information.type,
    revision: information.revision,
    dateCreated: information.dateCreated,
    lastModified: information.lastModified,
    linkedArtifacts: information.linkedArtifacts || [],
    isDeleted: information.isDeleted || false,
    deletedAt: information.deletedAt || null,
    customAttributes: filterValidCustomAttributes(information.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${information.title}

${information.content}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into an Information object
 */
export function markdownToInformation(markdown: string): Information {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  // Remove the title line from body
  const lines = body.split('\n');
  const contentLines = lines.filter((line) => !line.startsWith('# '));

  return {
    id: frontmatter.id || '',
    title: frontmatter.title || '',
    content: contentLines.join('\n').trim(),
    type: frontmatter.type || 'note',
    dateCreated: frontmatter.dateCreated || Date.now(),
    lastModified: frontmatter.lastModified || Date.now(),
    linkedArtifacts: frontmatter.linkedArtifacts || [],
    isDeleted: frontmatter.isDeleted || false,
    deletedAt: frontmatter.deletedAt || undefined,
    revision: frontmatter.revision || '01',
    customAttributes: frontmatter.customAttributes || [],
  };
}

/**
 * Convert a User to Markdown with YAML frontmatter
 */
export function userToMarkdown(user: User): string {
  const frontmatter = {
    id: user.id,
    name: user.name,
    dateCreated: user.dateCreated,
    lastModified: user.lastModified,
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${user.name}`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into a User object
 */
export function markdownToUser(markdown: string): User {
  const { frontmatter } = parseYamlFrontmatter(markdown);

  return {
    id: frontmatter.id || '',
    name: frontmatter.name || '',
    dateCreated: frontmatter.dateCreated || Date.now(),
    lastModified: frontmatter.lastModified || Date.now(),
  };
}

/**
 * Convert a Project to Markdown with YAML frontmatter
 */
export function projectToMarkdown(project: Project): string {
  const frontmatter = {
    id: project.id,
    name: project.name,
    description: project.description,
    lastModified: project.lastModified,
    requirementIds: project.requirementIds,
    useCaseIds: project.useCaseIds,
    testCaseIds: project.testCaseIds,
    informationIds: project.informationIds,
    riskIds: project.riskIds || [],
    isDeleted: project.isDeleted || false,
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${project.name}

${project.description}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into a Project object
 */
export function markdownToProject(markdown: string): Project | null {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  if (!frontmatter.id) {
    return null;
  }

  // Extract description from body (skip title line)
  const lines = body.split('\n');
  const descriptionLines = lines.filter((line) => !line.startsWith('# '));
  const description = descriptionLines.join('\n').trim() || frontmatter.description || '';

  return {
    id: frontmatter.id,
    name: frontmatter.name || '',
    description: description,
    requirementIds: frontmatter.requirementIds || [],
    useCaseIds: frontmatter.useCaseIds || [],
    testCaseIds: frontmatter.testCaseIds || [],
    informationIds: frontmatter.informationIds || [],
    riskIds: frontmatter.riskIds || [],
    lastModified: frontmatter.lastModified || Date.now(),
    isDeleted: frontmatter.isDeleted || false,
  };
}

/**
 * Convert a Risk to Markdown with YAML frontmatter
 */
export function riskToMarkdown(risk: Risk): string {
  const frontmatter = {
    id: risk.id,
    title: risk.title,
    category: risk.category,
    probability: risk.probability,
    impact: risk.impact,
    status: risk.status,
    owner: risk.owner || '',
    revision: risk.revision,
    dateCreated: risk.dateCreated,
    lastModified: risk.lastModified,
    linkedArtifacts: risk.linkedArtifacts || [],
    isDeleted: risk.isDeleted || false,
    deletedAt: risk.deletedAt || null,
    customAttributes: filterValidCustomAttributes(risk.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${risk.title}

## Description
${risk.description}

## Mitigation Strategy
${risk.mitigation}

## Contingency Plan
${risk.contingency}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into a Risk object
 */
export function markdownToRisk(markdown: string): Risk {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  const sections: Record<string, string> = {};
  const lines = body.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.substring(3).trim();
      currentContent = [];
    } else if (line.startsWith('# ')) {
      continue;
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return {
    id: frontmatter.id || '',
    title: frontmatter.title || '',
    description: sections['Description'] || '',
    category: frontmatter.category || 'other',
    probability: frontmatter.probability || 'medium',
    impact: frontmatter.impact || 'medium',
    mitigation: sections['Mitigation Strategy'] || '',
    contingency: sections['Contingency Plan'] || '',
    status: frontmatter.status || 'identified',
    owner: frontmatter.owner || undefined,
    dateCreated: frontmatter.dateCreated || Date.now(),
    lastModified: frontmatter.lastModified || Date.now(),
    linkedArtifacts: frontmatter.linkedArtifacts || [],
    isDeleted: frontmatter.isDeleted || false,
    deletedAt: frontmatter.deletedAt || undefined,
    revision: frontmatter.revision || '01',
    customAttributes: frontmatter.customAttributes || [],
  };
}

/**
 * Convert a CustomAttributeDefinition to Markdown with YAML frontmatter
 */
export function customAttributeDefinitionToMarkdown(def: CustomAttributeDefinition): string {
  const frontmatter = {
    id: def.id,
    name: def.name,
    type: def.type,
    description: def.description || '',
    required: def.required || false,
    defaultValue: def.defaultValue ?? null,
    options: def.options || [],
    appliesTo: def.appliesTo,
    dateCreated: def.dateCreated,
    lastModified: def.lastModified,
    isDeleted: def.isDeleted || false,
    deletedAt: def.deletedAt || null,
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${def.name}

${def.description || 'No description provided.'}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into a CustomAttributeDefinition object
 */
export function markdownToCustomAttributeDefinition(markdown: string): CustomAttributeDefinition {
  const { frontmatter } = parseYamlFrontmatter(markdown);

  return {
    id: frontmatter.id || '',
    name: frontmatter.name || '',
    type: frontmatter.type || 'text',
    description: frontmatter.description || undefined,
    required: frontmatter.required || false,
    defaultValue: frontmatter.defaultValue ?? undefined,
    options: frontmatter.options || undefined,
    appliesTo: frontmatter.appliesTo || [],
    dateCreated: frontmatter.dateCreated || Date.now(),
    lastModified: frontmatter.lastModified || Date.now(),
    isDeleted: frontmatter.isDeleted || false,
    deletedAt: frontmatter.deletedAt || undefined,
  };
}
