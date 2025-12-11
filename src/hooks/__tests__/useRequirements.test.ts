import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRequirements } from '../useRequirements';
import type { Requirement } from '../../types';

describe('useRequirements', () => {
  let mockRequirements: Requirement[];
  let mockSetRequirements: ReturnType<typeof vi.fn>;
  let mockSetUsedReqNumbers: ReturnType<typeof vi.fn>;
  let mockSetIsEditModalOpen: ReturnType<typeof vi.fn>;
  let mockSetEditingRequirement: ReturnType<typeof vi.fn>;
  let mockSaveArtifact: ReturnType<typeof vi.fn>;
  let mockDeleteArtifact: ReturnType<typeof vi.fn>;
  let usedReqNumbers: Set<number>;

  beforeEach(() => {
    mockRequirements = [
      {
        id: 'REQ-001',
        title: 'Test Requirement',
        description: 'Test Description',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'high',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
      },
    ];
    usedReqNumbers = new Set([1]);
    mockSetRequirements = vi.fn();
    mockSetUsedReqNumbers = vi.fn();
    mockSetIsEditModalOpen = vi.fn();
    mockSetEditingRequirement = vi.fn();
    mockSaveArtifact = vi.fn().mockResolvedValue(undefined);
    mockDeleteArtifact = vi.fn().mockResolvedValue(undefined);
  });

  const createHook = () =>
    useRequirements({
      requirements: mockRequirements,
      setRequirements: mockSetRequirements as any,
      usedReqNumbers,
      setUsedReqNumbers: mockSetUsedReqNumbers as any,
      setIsEditModalOpen: mockSetIsEditModalOpen as any,
      setEditingRequirement: mockSetEditingRequirement as any,
      saveArtifact: mockSaveArtifact as any,
      deleteArtifact: mockDeleteArtifact as any,
    });

  describe('handleAddRequirement', () => {
    it('should add a new requirement with generated ID', async () => {
      const hook = createHook();

      await hook.handleAddRequirement({
        title: 'New Requirement',
        description: 'New Description',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        dateCreated: Date.now(),
      });

      expect(mockSetUsedReqNumbers).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetRequirements).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'REQ-002',
            title: 'New Requirement',
            description: 'New Description',
          }),
        ])
      );
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'requirements',
        'REQ-002',
        expect.objectContaining({
          id: 'REQ-002',
          title: 'New Requirement',
        })
      );
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveArtifact.mockRejectedValue(new Error('Save failed'));

      const hook = createHook();

      await hook.handleAddRequirement({
        title: 'New Requirement',
        description: 'New Description',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        dateCreated: Date.now(),
      });

      expect(consoleError).toHaveBeenCalledWith('Failed to save requirement:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  describe('handleUpdateRequirement', () => {
    it('should update existing requirement and increment revision', async () => {
      const hook = createHook();

      await hook.handleUpdateRequirement('REQ-001', {
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(mockSetRequirements).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetIsEditModalOpen).toHaveBeenCalledWith(false);
      expect(mockSetEditingRequirement).toHaveBeenCalledWith(null);
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'requirements',
        'REQ-001',
        expect.objectContaining({
          id: 'REQ-001',
          title: 'Updated Title',
          revision: '02',
        })
      );
    });

    it('should not update if requirement not found', async () => {
      const hook = createHook();

      await hook.handleUpdateRequirement('REQ-999', {
        title: 'Updated Title',
      });

      expect(mockSetRequirements).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteRequirement', () => {
    it('should permanently delete a requirement', () => {
      const hook = createHook();

      hook.handleDeleteRequirement('REQ-001');

      expect(mockSetRequirements).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetIsEditModalOpen).toHaveBeenCalledWith(false);
      expect(mockSetEditingRequirement).toHaveBeenCalledWith(null);
      expect(mockDeleteArtifact).toHaveBeenCalledWith('requirements', 'REQ-001');
    });

    it('should filter out deleted requirement from state', () => {
      const reqs: Requirement[] = [
        {
          id: 'REQ-001',
          title: 'To Delete',
          description: '',
          text: '',
          rationale: '',
          status: 'draft',
          priority: 'high',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
        },
        {
          id: 'REQ-002',
          title: 'Keep',
          description: '',
          text: '',
          rationale: '',
          status: 'draft',
          priority: 'medium',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
        },
      ];

      let capturedUpdater: any;
      mockSetRequirements.mockImplementation((updater: any) => {
        capturedUpdater = updater;
      });

      mockRequirements = reqs;
      const hook = createHook();

      hook.handleDeleteRequirement('REQ-001');

      const result = capturedUpdater(reqs);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('REQ-002');
    });
  });
});
