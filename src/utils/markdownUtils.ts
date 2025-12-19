import type { Requirement, UseCase, TestCase, Information, User, Project, Risk, ArtifactLink } from '../types';
import type { CustomAttributeDefinition, CustomAttributeValue, AttributeType, ApplicableArtifactType } from '../types/customAttributes';
import {
  filterValidCustomAttributes,
  objectToYaml,
  parseYamlFrontmatter,
  extractH2Sections,
  ensureArray,
} from './markdownBase';

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
  const sections = extractH2Sections(body);

  return {
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    description: sections['Description'] || '',
    text: sections['Requirement Text'] || '',
    rationale: sections['Rationale'] || '',

    useCaseIds: ensureArray<string>(frontmatter.useCaseIds),
    linkedArtifacts: ensureArray<ArtifactLink>(frontmatter.linkedArtifacts),
    status: (frontmatter.status as Requirement['status']) || 'draft',
    priority: (frontmatter.priority as Requirement['priority']) || 'medium',
    author: (frontmatter.author as string) || undefined,
    verificationMethod: (frontmatter.verificationMethod as string) || undefined,
    comments: sections['Comments'] || undefined,
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    approvalDate: (frontmatter.approvalDate as number) || undefined,
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
    revision: (frontmatter.revision as string) || '01',
    customAttributes: ensureArray<CustomAttributeValue>(frontmatter.customAttributes),
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
  const sections = extractH2Sections(body);

  return {
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    description: sections['Description'] || '',
    actor: sections['Actor'] || (frontmatter.actor as string) || '',
    preconditions: sections['Preconditions'] || '',
    postconditions: sections['Postconditions'] || '',
    mainFlow: sections['Main Flow'] || '',
    alternativeFlows: sections['Alternative Flows'] || undefined,
    priority: (frontmatter.priority as UseCase['priority']) || 'medium',
    status: (frontmatter.status as UseCase['status']) || 'draft',
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    linkedArtifacts: ensureArray<ArtifactLink>(frontmatter.linkedArtifacts),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
    revision: (frontmatter.revision as string) || '01',
    customAttributes: ensureArray<CustomAttributeValue>(frontmatter.customAttributes),
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
  const sections = extractH2Sections(body);

  return {
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    description: sections['Description'] || '',
    requirementIds: ensureArray<string>(frontmatter.requirementIds),
    status: (frontmatter.status as TestCase['status']) || 'draft',
    priority: (frontmatter.priority as TestCase['priority']) || 'medium',
    author: (frontmatter.author as string) || undefined,
    lastRun: (frontmatter.lastRun as number) || undefined,
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    linkedArtifacts: ensureArray<ArtifactLink>(frontmatter.linkedArtifacts),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
    revision: (frontmatter.revision as string) || '01',
    customAttributes: ensureArray<CustomAttributeValue>(frontmatter.customAttributes),
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
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    content: contentLines.join('\n').trim(),
    type: (frontmatter.type as Information['type']) || 'note',
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    linkedArtifacts: ensureArray<ArtifactLink>(frontmatter.linkedArtifacts),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
    revision: (frontmatter.revision as string) || '01',
    customAttributes: ensureArray<CustomAttributeValue>(frontmatter.customAttributes),
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
    id: (frontmatter.id as string) || '',
    name: (frontmatter.name as string) || '',
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
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
  const description = descriptionLines.join('\n').trim() || (frontmatter.description as string) || '';

  return {
    id: frontmatter.id as string,
    name: (frontmatter.name as string) || '',
    description: description,
    requirementIds: ensureArray<string>(frontmatter.requirementIds),
    useCaseIds: ensureArray<string>(frontmatter.useCaseIds),
    testCaseIds: ensureArray<string>(frontmatter.testCaseIds),
    informationIds: ensureArray<string>(frontmatter.informationIds),
    riskIds: ensureArray<string>(frontmatter.riskIds),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
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
  const sections = extractH2Sections(body);

  return {
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    description: sections['Description'] || '',
    category: (frontmatter.category as Risk['category']) || 'other',
    probability: (frontmatter.probability as Risk['probability']) || 'medium',
    impact: (frontmatter.impact as Risk['impact']) || 'medium',
    mitigation: sections['Mitigation Strategy'] || '',
    contingency: sections['Contingency Plan'] || '',
    status: (frontmatter.status as Risk['status']) || 'identified',
    owner: (frontmatter.owner as string) || undefined,
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    linkedArtifacts: ensureArray<ArtifactLink>(frontmatter.linkedArtifacts),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
    revision: (frontmatter.revision as string) || '01',
    customAttributes: ensureArray<CustomAttributeValue>(frontmatter.customAttributes),
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
    id: (frontmatter.id as string) || '',
    name: (frontmatter.name as string) || '',
    type: (frontmatter.type as AttributeType) || 'text',
    description: (frontmatter.description as string) || undefined,
    required: (frontmatter.required as boolean) || false,
    defaultValue: frontmatter.defaultValue as string | number | boolean | undefined,
    options: ensureArray<string>(frontmatter.options),
    appliesTo: ensureArray<ApplicableArtifactType>(frontmatter.appliesTo),
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
  };
}
