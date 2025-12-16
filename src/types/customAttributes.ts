/**
 * Custom Attributes Types
 *
 * User-defined fields that can be attached to any artifact type.
 * Definitions are stored globally in custom-attributes/ folder.
 */

// Supported value types for custom attributes
export type AttributeType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';

// Which artifact types an attribute can apply to
export type ApplicableArtifactType =
  | 'requirement'
  | 'useCase'
  | 'testCase'
  | 'information'
  | 'risk'
  | 'link';

// Definition of a custom attribute (stored globally in custom-attributes/)
export interface CustomAttributeDefinition {
  id: string; // e.g., "ATTR-001"
  name: string; // Display name, e.g., "Component"
  type: AttributeType; // Value type
  description?: string; // Optional help text
  required?: boolean; // Whether value is required
  defaultValue?: string | number | boolean; // Default for new artifacts
  options?: string[]; // For dropdown type only
  appliesTo: ApplicableArtifactType[]; // Which artifact types can use this
  dateCreated: number;
  lastModified: number;
  isDeleted?: boolean; // Soft delete support
  deletedAt?: number;
}

// Value of a custom attribute on a specific artifact
export interface CustomAttributeValue {
  attributeId: string; // References CustomAttributeDefinition.id
  value: string | number | boolean | null; // Actual value
}

// Helper type for artifacts that support custom attributes
export interface HasCustomAttributes {
  customAttributes?: CustomAttributeValue[];
}
