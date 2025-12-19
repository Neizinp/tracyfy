export interface ArtifactTypeConfig {
  idPrefix: string;
  folder: string;
  label: string;
  type: string;
}

export const ARTIFACT_CONFIG: Record<string, ArtifactTypeConfig> = {
  requirements: {
    idPrefix: 'REQ',
    folder: 'requirements',
    label: 'Requirement',
    type: 'requirement',
  },
  usecases: {
    idPrefix: 'UC',
    folder: 'usecases',
    label: 'Use Case',
    type: 'usecase',
  },
  testcases: {
    idPrefix: 'TC',
    folder: 'testcases',
    label: 'Test Case',
    type: 'testcase',
  },
  information: {
    idPrefix: 'INFO',
    folder: 'information',
    label: 'Information',
    type: 'information',
  },
  risks: {
    idPrefix: 'RISK',
    folder: 'risks',
    label: 'Risk',
    type: 'risk',
  },
  links: {
    idPrefix: 'LINK',
    folder: 'links',
    label: 'Link',
    type: 'link',
  },
  users: {
    idPrefix: 'USER',
    folder: 'users',
    label: 'User',
    type: 'user',
  },
  workflows: {
    idPrefix: 'WF',
    folder: 'workflows',
    label: 'Workflow',
    type: 'workflow',
  },
  projects: {
    idPrefix: 'PROJ',
    folder: 'projects',
    label: 'Project',
    type: 'project',
  },
  customAttributes: {
    idPrefix: 'ATTR',
    folder: 'custom-attributes',
    label: 'Custom Attribute',
    type: 'customAttribute',
  },
};

// Map of folder names to internal types
export const FOLDER_TO_TYPE: Record<string, string> = Object.values(ARTIFACT_CONFIG).reduce(
  (acc, config) => {
    acc[config.folder] = config.type;
    return acc;
  },
  {} as Record<string, string>
);

// Map of ID prefixes to internal types
export const PREFIX_TO_TYPE: Record<string, string> = Object.entries(ARTIFACT_CONFIG).reduce(
  (acc, [key, config]) => {
    acc[config.idPrefix] = key;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Identify artifact type from its ID (e.g., REQ-001 -> requirements)
 */
export function getTypeFromId(id: string): string {
  const prefix = id.split('-')[0];
  return PREFIX_TO_TYPE[prefix] || 'unknown';
}
