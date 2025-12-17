import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { GlobalStateProvider, useGlobalState } from '../GlobalStateProvider';
import type { Requirement, UseCase, TestCase, Information, Project } from '../../../types';

// Mock FileSystemProvider
const mockFsRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'Test Requirement',
    text: 'Text',
    status: 'draft',
    priority: 'high',
    description: '',
    rationale: '',
    revision: '01',

    dateCreated: 1000000,
    lastModified: 1000000,
    linkedArtifacts: [],
    isDeleted: false,
  },
];

const mockFsUseCases: UseCase[] = [
  {
    id: 'UC-001',
    title: 'Test Use Case',
    description: '',
    actor: '',
    preconditions: '',
    mainFlow: '',
    alternativeFlows: '',
    postconditions: '',
    status: 'draft',
    priority: 'medium',
    revision: '01',
    lastModified: 1000000,
    linkedArtifacts: [],
    isDeleted: false,
  },
];

const mockFsTestCases: TestCase[] = [
  {
    id: 'TC-001',
    title: 'Test Test Case',
    description: '',
    status: 'draft',
    priority: 'medium',
    revision: '01',
    dateCreated: 1000000,
    lastModified: 1000000,
    requirementIds: [],
    author: '',
    isDeleted: false,
  },
];

const mockFsInformation: Information[] = [
  {
    id: 'INFO-001',
    title: 'Test Information',
    content: '',
    type: 'note',
    revision: '01',
    dateCreated: 1000000,
    lastModified: 1000000,
    linkedArtifacts: [],
    isDeleted: false,
  },
];

const mockCurrentProject: Project = {
  id: 'proj-001',
  name: 'Test Project',
  description: 'Test',
  requirementIds: ['REQ-001'],
  useCaseIds: ['UC-001'],
  testCaseIds: ['TC-001'],
  informationIds: ['INFO-001'],
  riskIds: [],
  lastModified: 1000000,
};

vi.mock('../FileSystemProvider', () => ({
  useFileSystem: vi.fn(() => ({
    requirements: mockFsRequirements,
    useCases: mockFsUseCases,
    testCases: mockFsTestCases,
    information: mockFsInformation,
  })),
}));

vi.mock('../ProjectProvider', () => ({
  useProject: vi.fn(() => ({
    currentProject: mockCurrentProject,
  })),
}));

describe('GlobalStateProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider rendering', () => {
    it('should render children', () => {
      render(
        <GlobalStateProvider>
          <div data-testid="child">Child content</div>
        </GlobalStateProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('useGlobalState hook', () => {
    it('should provide global artifacts from filesystem', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GlobalStateProvider>{children}</GlobalStateProvider>
      );

      const { result } = renderHook(() => useGlobalState(), { wrapper });

      expect(result.current.globalRequirements).toEqual(mockFsRequirements);
      expect(result.current.globalUseCases).toEqual(mockFsUseCases);
      expect(result.current.globalTestCases).toEqual(mockFsTestCases);
      expect(result.current.globalInformation).toEqual(mockFsInformation);
    });

    it('should provide filtered artifacts for current project', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GlobalStateProvider>{children}</GlobalStateProvider>
      );

      const { result } = renderHook(() => useGlobalState(), { wrapper });

      // Filtered artifacts should match project's IDs
      expect(result.current.requirements).toHaveLength(1);
      expect(result.current.requirements[0].id).toBe('REQ-001');
      expect(result.current.useCases).toHaveLength(1);
      expect(result.current.testCases).toHaveLength(1);
      expect(result.current.information).toHaveLength(1);
    });

    it('should provide setter functions', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GlobalStateProvider>{children}</GlobalStateProvider>
      );

      const { result } = renderHook(() => useGlobalState(), { wrapper });

      expect(typeof result.current.setRequirements).toBe('function');
      expect(typeof result.current.setUseCases).toBe('function');
      expect(typeof result.current.setTestCases).toBe('function');
      expect(typeof result.current.setInformation).toBe('function');
    });

    it('should provide isResetting ref', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GlobalStateProvider>{children}</GlobalStateProvider>
      );

      const { result } = renderHook(() => useGlobalState(), { wrapper });

      expect(result.current.isResetting).toBeDefined();
      expect(result.current.isResetting.current).toBe(false);
    });

    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGlobalState());
      }).toThrow('useGlobalState must be used within a GlobalStateProvider');

      consoleSpy.mockRestore();
    });
  });
});
