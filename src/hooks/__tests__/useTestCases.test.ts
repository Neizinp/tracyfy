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
        description: 'Description',
        status: 'draft',
        priority: 'high',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        requirementIds: [],
        author: '',
        isDeleted: false,
      },
    ];
    usedTestNumbers = new Set([1]);
    mockSetTestCases = vi.fn() as any;
    mockSetUsedTestNumbers = vi.fn() as any;
    mockSaveArtifact = vi.fn().mockResolvedValue(undefined) as any;
    mockDeleteArtifact = vi.fn().mockResolvedValue(undefined) as any;
  });

  describe('handleAddTestCase', () => {
    it('should add a new test case with generated ID', async () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      await hook.handleAddTestCase({
        title: 'New Test Case',
        description: 'New Description',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        requirementIds: [],
      });

      expect(mockSetTestCases).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'TC-002',
            title: 'New Test Case',
            description: 'New Description',
          }),
        ])
      );
      expect(mockSetUsedTestNumbers).toHaveBeenCalledWith(expect.any(Set));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'testcases',
        'TC-002',
        expect.objectContaining({
          id: 'TC-002',
          title: 'New Test Case',
        })
      );
    });

    it('should set dateCreated and lastModified timestamps', async () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      await hook.handleAddTestCase({
        title: 'New Test Case',
        description: 'Description',
        status: 'draft',
        priority: 'high',
        revision: '01',
        requirementIds: [],
      });

      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'testcases',
        'TC-002',
        expect.objectContaining({
          dateCreated: expect.any(Number),
          lastModified: expect.any(Number),
        })
      );
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveArtifact.mockRejectedValue(new Error('Save failed'));

      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      await hook.handleAddTestCase({
        title: 'New Test Case',
        description: 'Description',
        status: 'draft',
        priority: 'high',
        revision: '01',
        requirementIds: [],
      });

      expect(consoleError).toHaveBeenCalledWith('Failed to save test case:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  describe('handleUpdateTestCase', () => {
    it('should update existing test case and increment revision', async () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      await hook.handleUpdateTestCase('TC-001', {
        title: 'Updated Title',
        description: 'Updated Description',
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

    it('should update lastModified timestamp', async () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      const beforeTime = Date.now();
      await hook.handleUpdateTestCase('TC-001', {
        title: 'Updated Title',
      });
      const afterTime = Date.now();

      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'testcases',
        'TC-001',
        expect.objectContaining({
          lastModified: expect.any(Number),
        })
      );

      const savedTestCase = mockSaveArtifact.mock.calls[0][2] as TestCase;
      expect(savedTestCase.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(savedTestCase.lastModified).toBeLessThanOrEqual(afterTime);
    });

    it('should not update if test case not found', async () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      await hook.handleUpdateTestCase('TC-999', {
        title: 'Updated Title',
      });

      expect(mockSetTestCases).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteTestCase', () => {
    it('should soft delete a test case', () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      hook.handleDeleteTestCase('TC-001');

      expect(mockSetTestCases).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'TC-001',
            isDeleted: true,
            deletedAt: expect.any(Number),
          }),
        ])
      );
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'testcases',
        'TC-001',
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Number),
        })
      );
    });

    it('should not delete if test case not found', () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      hook.handleDeleteTestCase('TC-999');

      // If test case not found, setTestCases is not called
      expect(mockSetTestCases).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handlePermanentDeleteTestCase', () => {
    it('should permanently delete test case', () => {
      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      hook.handlePermanentDeleteTestCase('TC-001');

      expect(mockSetTestCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDeleteArtifact).toHaveBeenCalledWith('testcases', 'TC-001');
    });

    it('should remove test case from array', () => {
      let capturedUpdater: any;
      mockSetTestCases.mockImplementation((updater) => {
        capturedUpdater = updater;
      });

      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      hook.handlePermanentDeleteTestCase('TC-001');

      const result = capturedUpdater(mockTestCases);
      expect(result).toEqual([]);
    });

    it('should handle delete errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteArtifact.mockRejectedValue(new Error('Delete failed'));

      const hook = useTestCases({
        testCases: mockTestCases,
        setTestCases: mockSetTestCases,
        usedTestNumbers,
        setUsedTestNumbers: mockSetUsedTestNumbers,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      } as any);

      hook.handlePermanentDeleteTestCase('TC-001');

      // Wait for async error handling
      setTimeout(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to delete test case:', expect.any(Error));
        consoleError.mockRestore();
      }, 0);
    });
  });
});
