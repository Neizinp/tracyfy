import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTestCases } from '../useTestCases';
import type { TestCase } from '../../types';

describe('useTestCases', () => {
  let mockTestCases: TestCase[];
  let mockSetTestCases: ReturnType<typeof vi.fn>;
  let mockSetUsedTestNumbers: ReturnType<typeof vi.fn>;
  let mockSaveArtifact: ReturnType<typeof vi.fn>;
  let mockDeleteArtifact: ReturnType<typeof vi.fn>;
  let usedTestNumbers: Set<number>;

  beforeEach(() => {
    mockTestCases = [
      {
        id: 'TC-001',
        title: 'Test Case 1',
        description: 'Test Description',
        requirementIds: [],
        status: 'draft',
        priority: 'high',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
      },
    ];
    usedTestNumbers = new Set([1]);
    mockSetTestCases = vi.fn();
    mockSetUsedTestNumbers = vi.fn();
    mockSaveArtifact = vi.fn().mockResolvedValue(undefined);
    mockDeleteArtifact = vi.fn().mockResolvedValue(undefined);
  });

  const createHook = () =>
    useTestCases({
      testCases: mockTestCases,
      setTestCases: mockSetTestCases as any,
      usedTestNumbers,
      setUsedTestNumbers: mockSetUsedTestNumbers as any,
      saveArtifact: mockSaveArtifact as any,
      deleteArtifact: mockDeleteArtifact as any,
    });

  describe('handleAddTestCase', () => {
    it('should add a new test case with generated ID', async () => {
      const hook = createHook();

      await hook.handleAddTestCase({
        title: 'New Test Case',
        description: 'New Description',
        requirementIds: [],
        status: 'draft',
        priority: 'medium',
        revision: '01',
      });

      expect(mockSetTestCases).toHaveBeenCalled();
      expect(mockSetUsedTestNumbers).toHaveBeenCalled();
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'testcases',
        'TC-002',
        expect.objectContaining({
          id: 'TC-002',
          title: 'New Test Case',
        })
      );
    });
  });

  describe('handleUpdateTestCase', () => {
    it('should update existing test case and increment revision', async () => {
      const hook = createHook();

      await hook.handleUpdateTestCase('TC-001', {
        title: 'Updated Title',
        status: 'passed',
      });

      expect(mockSetTestCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'testcases',
        'TC-001',
        expect.objectContaining({
          id: 'TC-001',
          title: 'Updated Title',
          revision: '02',
        })
      );
    });

    it('should not update if test case not found', async () => {
      const hook = createHook();

      await hook.handleUpdateTestCase('TC-999', {
        title: 'Updated Title',
      });

      expect(mockSetTestCases).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteTestCase', () => {
    it('should permanently delete a test case', () => {
      const hook = createHook();

      hook.handleDeleteTestCase('TC-001');

      expect(mockSetTestCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDeleteArtifact).toHaveBeenCalledWith('testcases', 'TC-001');
    });

    it('should filter out deleted test case from state', () => {
      const testCases: TestCase[] = [
        {
          id: 'TC-001',
          title: 'To Delete',
          description: '',
          requirementIds: [],
          status: 'draft',
          priority: 'high',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
        },
        {
          id: 'TC-002',
          title: 'Keep',
          description: '',
          requirementIds: [],
          status: 'passed',
          priority: 'medium',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
        },
      ];

      let capturedUpdater: any;
      mockSetTestCases.mockImplementation((updater: any) => {
        capturedUpdater = updater;
      });

      mockTestCases = testCases;
      const hook = createHook();

      hook.handleDeleteTestCase('TC-001');

      const result = capturedUpdater(testCases);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('TC-002');
    });
  });
});
