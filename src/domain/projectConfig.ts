/**
 * tracyfy.yaml: the project's settings, at the root of the folder.
 *
 *   schemaVersion: 1
 *   name: Door Controller
 *   description: |
 *     Controls the lobby doors.
 *   customAttributes:
 *     - id: ATTR-001
 *       name: Component
 *       type: dropdown
 *       options: [UI, Backend]
 *       appliesTo: [requirement, testCase]
 *   lifecycle:
 *     reviewOnContentChange: false   # left out: true
 *   traceability:                    # left out: DEFAULT_TRACEABILITY (traceability.ts)
 *     allowed:
 *       - [testCase, verifies, requirement]
 *     coverage:
 *       - name: Every requirement is verified
 *         kind: requirement
 *         needs: { incoming: verifies, from: testCase }
 *
 * Plain text the team edits and merges like any other file. Parsing validates
 * the content, so a broken file is reported instead of silently becoming
 * different settings.
 *
 * Pure TypeScript: no React, no IO.
 */
import { parse, stringify } from 'yaml';
import { z } from 'zod';
import { KIND_IDS } from './artifactKinds';
import { nextIds } from './ids';
import type { CustomAttributeDefinition } from '../types/customAttributes';
import type { Project } from '../types/project';
import { DEFAULT_LIFECYCLE_SETTINGS, type LifecycleSettings } from './lifecycle';
import { LINK_TYPE_IDS } from './linkTypes';
import {
  DEFAULT_TRACEABILITY,
  type AllowedLink,
  type CoverageRule,
  type TraceabilityRules,
} from './traceability';

export const PROJECT_CONFIG_FILE = 'tracyfy.yaml';

/** Bumped (with an explicit migration) whenever the file format changes */
export const SCHEMA_VERSION = 1;

const customAttributeSchema = z.object({
  id: z.string().regex(/^ATTR-\d+$/, 'must look like ATTR-001'),
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'dropdown', 'checkbox']),
  description: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  options: z.array(z.string()).optional(),
  appliesTo: z.array(z.enum([...KIND_IDS, 'link'])),
});

const kindId = z.enum(KIND_IDS);
const linkType = z.enum(LINK_TYPE_IDS);
const kindPattern = z.union([kindId, z.literal('*')]);

const traceabilitySchema = z
  .object({
    allowed: z.array(z.tuple([kindPattern, linkType, kindPattern])).optional(),
    coverage: z
      .array(
        z
          .object({
            name: z.string().min(1),
            kind: kindId,
            needs: z.union([
              z.object({ incoming: linkType, from: kindId.optional() }).strict(),
              z.object({ outgoing: linkType, to: kindId.optional() }).strict(),
            ]),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

const projectConfigSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: z.string().min(1),
  description: z.string().default(''),
  customAttributes: z.array(customAttributeSchema).default([]),
  lifecycle: z.object({ reviewOnContentChange: z.boolean().optional() }).strict().optional(),
  traceability: traceabilitySchema.optional(),
});

export interface ProjectConfig {
  schemaVersion: typeof SCHEMA_VERSION;
  name: string;
  description: string;
  customAttributes: CustomAttributeDefinition[];
  /** Only what the file sets; see lifecycleSettings() for the values in effect */
  lifecycle?: Partial<LifecycleSettings>;
  /** Only what the file sets; a list it leaves out is the default one */
  traceability?: { allowed?: AllowedLink[]; coverage?: CoverageRule[] };
}

/** The rules a project works by, as in effect (defaults filled in) */
export interface ProjectSettings {
  lifecycle: LifecycleSettings;
  traceability: TraceabilityRules;
}

/** The settings in effect: the file's, with defaults for what it leaves out */
export function settingsOf(config: ProjectConfig): ProjectSettings {
  return {
    lifecycle: { ...DEFAULT_LIFECYCLE_SETTINGS, ...config.lifecycle },
    traceability: {
      allowed: config.traceability?.allowed ?? DEFAULT_TRACEABILITY.allowed,
      coverage: config.traceability?.coverage ?? DEFAULT_TRACEABILITY.coverage,
    },
  };
}

export const DEFAULT_SETTINGS: ProjectSettings = settingsOf(defaultProjectConfig(''));

/** The settings of a folder that has no tracyfy.yaml yet */
export function defaultProjectConfig(name: string): ProjectConfig {
  return { schemaVersion: SCHEMA_VERSION, name, description: '', customAttributes: [] };
}

export class ProjectConfigError extends Error {
  constructor(message: string) {
    super(`${PROJECT_CONFIG_FILE}: ${message}`);
    this.name = 'ProjectConfigError';
  }
}

/** Parse and validate tracyfy.yaml; throws ProjectConfigError naming what is wrong */
export function parseProjectConfig(text: string): ProjectConfig {
  let data: unknown;
  try {
    data = parse(text);
  } catch (err) {
    throw new ProjectConfigError(`not valid YAML (${(err as Error).message})`);
  }
  const result = projectConfigSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(file)'}: ${i.message}`)
      .join('; ');
    throw new ProjectConfigError(issues);
  }
  return result.data as ProjectConfig;
}

/** Stable, readable YAML: fixed key order, empty optional fields left out */
export function serializeProjectConfig(config: ProjectConfig): string {
  const attributes = config.customAttributes.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    ...(a.description ? { description: a.description } : {}),
    ...(a.required ? { required: true } : {}),
    ...(a.defaultValue !== undefined && a.defaultValue !== ''
      ? { defaultValue: a.defaultValue }
      : {}),
    ...(a.options && a.options.length > 0 ? { options: a.options } : {}),
    appliesTo: a.appliesTo,
  }));
  return stringify(
    {
      schemaVersion: config.schemaVersion,
      name: config.name,
      description: config.description,
      ...(attributes.length > 0 ? { customAttributes: attributes } : {}),
      ...(config.lifecycle && Object.keys(config.lifecycle).length > 0
        ? { lifecycle: config.lifecycle }
        : {}),
      ...(config.traceability ? { traceability: config.traceability } : {}),
    },
    { lineWidth: 0 }
  );
}

export function projectOf(config: ProjectConfig): Project {
  return { name: config.name, description: config.description };
}

/** The config with one more custom attribute, which gets the next free ATTR ID */
export function withNewAttribute(
  config: ProjectConfig,
  def: Omit<CustomAttributeDefinition, 'id'>
): { config: ProjectConfig; created: CustomAttributeDefinition } {
  const [id] = nextIds(
    'ATTR',
    config.customAttributes.map((d) => d.id),
    1
  );
  const created = { ...def, id };
  return {
    config: { ...config, customAttributes: [...config.customAttributes, created] },
    created,
  };
}
