import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  User,
  Project,
  Risk,
  ArtifactLink,
  ArtifactDocument,
  DocumentEntry,
  BaseArtifact,
} from '../types';
import type {
  CustomAttributeDefinition,
  CustomAttributeValue,
  AttributeType,
  ApplicableArtifactType,
} from '../types/customAttributes';
import {
  filterValidCustomAttributes,
  objectToYaml,
  parseYamlFrontmatter,
  extractH2Sections,
  ensureArray,
  escapeBodyText as esc,
  unescapeBodyText,
  bodyWithoutTitle,
} from './markdownBase';
import type { ArtifactKindId } from '../domain/artifactKinds';

/**
 * Convert a Requirement to Markdown with YAML frontmatter
 */
export function requirementToMarkdown(requirement: Requirement): string {
  const frontmatter = {
    id: requirement.id,
    title: requirement.title,
    status: requirement.status,
    priority: requirement.priority,
    category: requirement.category,
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
${esc(requirement.description)}

## Requirement Text
${esc(requirement.text)}

## Rationale
${esc(requirement.rationale)}

${requirement.comments ? `## Comments\n${esc(requirement.comments)}` : ''}
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

    category: (frontmatter.category as string) || 'technical',
    useCaseIds: ensureArray<string>(frontmatter.useCaseIds),
    linkedArtifacts: ensureArray<ArtifactLink>(frontmatter.linkedArtifacts),
    status: (frontmatter.status as string) || 'draft',
    priority: (frontmatter.priority as string) || 'medium',
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
    dateCreated: useCase.dateCreated,
    lastModified: useCase.lastModified,
    actor: useCase.actor,
    author: useCase.author || '',
    useCaseIds: useCase.useCaseIds || [],
    linkedArtifacts: useCase.linkedArtifacts || [],
    isDeleted: useCase.isDeleted || false,
    deletedAt: useCase.deletedAt || null,
    customAttributes: filterValidCustomAttributes(useCase.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${useCase.title}

## Description
${esc(useCase.description)}

## Actor
${esc(useCase.actor)}

## Preconditions
${esc(useCase.preconditions || useCase.precondition)}

## Main Flow
${esc(useCase.mainFlow)}

${useCase.alternativeFlows ? `## Alternative Flows\n${esc(useCase.alternativeFlows)}` : ''}

## Postconditions
${esc(useCase.postconditions || useCase.postcondition)}
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
    precondition: sections['Precondition'] || sections['Preconditions'] || '',
    postcondition: sections['Postcondition'] || sections['Postconditions'] || '',
    preconditions: sections['Preconditions'] || sections['Precondition'] || '',
    postconditions: sections['Postconditions'] || sections['Postcondition'] || '',
    mainFlow: sections['Main Flow'] || '',
    alternativeFlows: sections['Alternative Flows'] || '',
    priority: (frontmatter.priority as string) || 'medium',
    status: (frontmatter.status as string) || 'draft',
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    author: (frontmatter.author as string) || undefined,
    useCaseIds: ensureArray<string>(frontmatter.useCaseIds),
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
    requirementIds: testCase.requirementIds || [],
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
${esc(testCase.description)}

## Steps
${esc(testCase.steps)}

## Expected Result
${esc(testCase.expectedResult)}

## Requirements Covered
${(testCase.requirementIds || []).map((id) => `- ${id}`).join('\n')}
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
    steps: sections['Steps'] || '',
    expectedResult: sections['Expected Result'] || '',
    requirementIds: ensureArray<string>(frontmatter.requirementIds),
    status: (frontmatter.status as string) || 'draft',
    priority: (frontmatter.priority as string) || 'medium',
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
    status: information.status,
    author: information.author || '',
    description: information.description,
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

${esc(information.text || information.content)}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into an Information object
 */
export function markdownToInformation(markdown: string): Information {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  // Everything after the "# Title" line is the user's text
  const text = unescapeBodyText(bodyWithoutTitle(body));

  return {
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    text: text,
    content: text,
    type: (frontmatter.type as string) || 'note',
    description: (frontmatter.description as string) || undefined,
    status: (frontmatter.status as string) || undefined,
    author: (frontmatter.author as string) || undefined,
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
 * project.md: the project's name (frontmatter) and description (body)
 */
export function projectToMarkdown(project: Project): string {
  const yaml = objectToYaml({ name: project.name });
  return `${yaml}\n\n# ${project.name}\n\n${esc(project.description)}`.trim() + '\n';
}

/**
 * Parse project.md, or null if it has no project name
 */
export function markdownToProject(markdown: string): Project | null {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);
  const name = typeof frontmatter.name === 'string' ? frontmatter.name : '';
  if (!name) return null;
  return { name, description: unescapeBodyText(bodyWithoutTitle(body)) };
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
    author: risk.author || '',
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
${esc(risk.description)}

## Mitigation Strategy
${esc(risk.mitigation)}

## Contingency Plan
${esc(risk.contingency)}
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
    category: (frontmatter.category as string) || 'other',
    probability: (frontmatter.probability as string) || 'medium',
    impact: (frontmatter.impact as string) || 'medium',
    mitigation: sections['Mitigation Strategy'] || '',
    contingency: sections['Contingency Plan'] || '',
    status: (frontmatter.status as string) || 'identified',
    owner: (frontmatter.owner as string) || undefined,
    author: (frontmatter.author as string) || undefined,
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

${esc(def.description) || 'No description provided.'}
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

/**
 * Convert an ArtifactDocument to Markdown with YAML frontmatter
 */
export function documentToMarkdown(document: ArtifactDocument): string {
  const frontmatter = {
    id: document.id,
    title: document.title,
    author: document.author || '',
    status: document.status,
    revision: document.revision,
    dateCreated: document.dateCreated,
    lastModified: document.lastModified,
    isDeleted: document.isDeleted || false,
    deletedAt: document.deletedAt || null,
    structure: document.structure || [],
    linkedArtifacts: document.linkedArtifacts || [],
    customAttributes: filterValidCustomAttributes(document.customAttributes),
  };

  const yaml = objectToYaml(frontmatter);

  const body = `# ${document.title}

${esc(document.description)}
`.trim();

  return `${yaml}\n\n${body}`;
}

/**
 * Parse Markdown content into an ArtifactDocument object
 */
export function markdownToDocument(markdown: string): ArtifactDocument {
  const { frontmatter, body } = parseYamlFrontmatter(markdown);

  // Description is the body after the "# Title" line
  const description = unescapeBodyText(bodyWithoutTitle(body));

  return {
    id: (frontmatter.id as string) || '',
    title: (frontmatter.title as string) || '',
    description: description,
    structure: ensureArray<DocumentEntry>(frontmatter.structure),
    author: (frontmatter.author as string) || undefined,
    status: (frontmatter.status as string) || undefined,
    linkedArtifacts: ensureArray<ArtifactLink>(frontmatter.linkedArtifacts),
    dateCreated: (frontmatter.dateCreated as number) || Date.now(),
    lastModified: (frontmatter.lastModified as number) || Date.now(),
    isDeleted: (frontmatter.isDeleted as boolean) || false,
    deletedAt: (frontmatter.deletedAt as number) || undefined,
    revision: (frontmatter.revision as string) || '01',
    customAttributes: ensureArray<CustomAttributeValue>(frontmatter.customAttributes),
  };
}

/** Parse an artifact file of the given kind */
export const MARKDOWN_TO_ARTIFACT: Record<ArtifactKindId, (markdown: string) => BaseArtifact> = {
  requirement: markdownToRequirement,
  useCase: markdownToUseCase,
  testCase: markdownToTestCase,
  information: markdownToInformation,
  risk: markdownToRisk,
  document: markdownToDocument,
};
