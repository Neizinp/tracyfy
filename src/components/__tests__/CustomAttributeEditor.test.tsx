/**
 * CustomAttributeEditor Component Tests
 *
 * Tests for the component that renders and edits custom attribute values on artifacts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomAttributeEditor } from '../CustomAttributeEditor';
import type { CustomAttributeDefinition, CustomAttributeValue } from '../../types/customAttributes';

describe('CustomAttributeEditor', () => {
  const mockDefinitions: CustomAttributeDefinition[] = [
    {
      id: 'ATTR-001',
      name: 'Target Release',
      type: 'dropdown',
      description: 'Select target release',
      options: ['v1.0', 'v1.1', 'v2.0'],
      appliesTo: ['requirement'],
      required: false,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'ATTR-002',
      name: 'Safety Critical',
      type: 'checkbox',
      description: 'Is safety critical',
      appliesTo: ['requirement', 'testCase'],
      required: true,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'ATTR-003',
      name: 'Priority Score',
      type: 'number',
      description: 'Numeric priority',
      appliesTo: ['requirement'],
      required: false,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'ATTR-004',
      name: 'Notes',
      type: 'text',
      description: 'Additional notes',
      appliesTo: ['requirement'],
      required: false,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'ATTR-005',
      name: 'Due Date',
      type: 'date',
      description: 'Due date',
      appliesTo: ['requirement'],
      required: false,
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
  ];

  const mockValues: CustomAttributeValue[] = [
    { attributeId: 'ATTR-001', value: 'v1.1' },
    { attributeId: 'ATTR-002', value: true },
    { attributeId: 'ATTR-003', value: 75 },
  ];

  let mockOnChange: any;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  describe('Rendering', () => {
    it('should render all applicable definitions for the artifact type', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      // Should show all 5 definitions that apply to requirements
      expect(screen.getByText('Target Release')).toBeInTheDocument();
      expect(screen.getByText('Safety Critical')).toBeInTheDocument();
      expect(screen.getByText('Priority Score')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Due Date')).toBeInTheDocument();
    });

    it('should filter definitions by artifact type', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="testCase"
        />
      );

      // Only Safety Critical applies to testCase
      expect(screen.getByText('Safety Critical')).toBeInTheDocument();
      expect(screen.queryByText('Target Release')).not.toBeInTheDocument();
    });

    it('should show empty state when no definitions exist', () => {
      render(
        <CustomAttributeEditor
          definitions={[]}
          values={[]}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      expect(screen.getByText(/No custom attributes defined/i)).toBeInTheDocument();
    });

    it('should show empty state when no definitions apply to artifact type', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="information"
        />
      );

      expect(
        screen.getByText(/No custom attributes defined for this artifact type/i)
      ).toBeInTheDocument();
    });
  });

  describe('Value display', () => {
    it('should display existing values', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={mockValues}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      // Dropdown should have v1.1 selected
      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toHaveValue('v1.1');

      // Checkbox should be checked
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      // Number input should have 75
      const numberInput = screen.getByRole('spinbutton');
      expect(numberInput).toHaveValue(75);
    });
  });

  describe('Value editing', () => {
    it('should call onChange when text value changes', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      const textInput = screen.getByPlaceholderText(/Enter Notes/i);
      fireEvent.change(textInput, { target: { value: 'Test notes' } });

      expect(mockOnChange).toHaveBeenCalled();
      const newValues = mockOnChange.mock.calls[0][0];
      expect(newValues.some((v: CustomAttributeValue) => v.attributeId === 'ATTR-004')).toBe(true);
    });

    it('should call onChange when dropdown value changes', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      const dropdown = screen.getByRole('combobox');
      fireEvent.change(dropdown, { target: { value: 'v2.0' } });

      expect(mockOnChange).toHaveBeenCalled();
      const newValues = mockOnChange.mock.calls[0][0];
      const attrValue = newValues.find((v: CustomAttributeValue) => v.attributeId === 'ATTR-001');
      expect(attrValue?.value).toBe('v2.0');
    });

    it('should call onChange when checkbox value changes', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalled();
      const newValues = mockOnChange.mock.calls[0][0];
      const attrValue = newValues.find((v: CustomAttributeValue) => v.attributeId === 'ATTR-002');
      expect(attrValue?.value).toBe(true);
    });

    it('should call onChange when number value changes', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      const numberInput = screen.getByRole('spinbutton');
      fireEvent.change(numberInput, { target: { value: '100' } });

      expect(mockOnChange).toHaveBeenCalled();
      const newValues = mockOnChange.mock.calls[0][0];
      const attrValue = newValues.find((v: CustomAttributeValue) => v.attributeId === 'ATTR-003');
      expect(attrValue?.value).toBe(100);
    });
  });

  describe('Required field indicator', () => {
    it('should show asterisk for required fields', () => {
      render(
        <CustomAttributeEditor
          definitions={mockDefinitions}
          values={[]}
          onChange={mockOnChange}
          artifactType="requirement"
        />
      );

      // Safety Critical is marked as required
      const safetyCriticalLabel = screen.getByText('Safety Critical');
      // The asterisk should be in the same label container
      expect(safetyCriticalLabel.parentElement?.textContent).toContain('*');
    });
  });
});
