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
        parentIds: [],
      },
    ];
    usedReqNumbers = new Set([1]);
    mockSetRequirements = vi.fn() as any;
    mockSetUsedReqNumbers = vi.fn() as any;
    mockSetIsEditModalOpen = vi.fn() as any;
    mockSetEditingRequirement = vi.fn() as any;
    mockSaveArtifact = vi.fn().mockResolvedValue(undefined) as any;
    mockDeleteArtifact = vi.fn().mockResolvedValue(undefined) as any;
  });

  describe('handleAddRequirement', () => {
    it('should add a new requirement with generated ID', async () => {
      const hook = useRequirements({
        requirements: mockRequirements,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      await hook.handleAddRequirement({
        title: 'New Requirement',
        description: 'New Description',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        dateCreated: Date.now(),
        parentIds: [],
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

      const hook = useRequirements({
        requirements: mockRequirements,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      await hook.handleAddRequirement({
        title: 'New Requirement',
        description: 'New Description',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        dateCreated: Date.now(),
        parentIds: [],
      });

      expect(consoleError).toHaveBeenCalledWith('Failed to save requirement:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  describe('handleUpdateRequirement', () => {
    it('should update existing requirement and increment revision', async () => {
      const hook = useRequirements({
        requirements: mockRequirements,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

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
      const hook = useRequirements({
        requirements: mockRequirements,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      await hook.handleUpdateRequirement('REQ-999', {
        title: 'Updated Title',
      });

      expect(mockSetRequirements).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteRequirement', () => {
    it('should soft delete a requirement', () => {
      const hook = useRequirements({
        requirements: mockRequirements,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      hook.handleDeleteRequirement('REQ-001');

      expect(mockSetRequirements).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetIsEditModalOpen).toHaveBeenCalledWith(false);
      expect(mockSetEditingRequirement).toHaveBeenCalledWith(null);
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'requirements',
        'REQ-001',
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Number),
        })
      );
    });

    it('should not delete if requirement not found', () => {
      const hook = useRequirements({
        requirements: mockRequirements,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      hook.handleDeleteRequirement('REQ-999');

      expect(mockSetRequirements).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handleRestoreRequirement', () => {
    it('should restore a soft-deleted requirement', () => {
      const deletedReq: Requirement = {
        ...mockRequirements[0],
        isDeleted: true,
        deletedAt: 2000000,
      };

      const hook = useRequirements({
        requirements: [deletedReq],
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      hook.handleRestoreRequirement('REQ-001');

      expect(mockSetRequirements).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'requirements',
        'REQ-001',
        expect.objectContaining({
          isDeleted: false,
          deletedAt: undefined,
        })
      );
    });

    it('should not restore if requirement not found', () => {
      const hook = useRequirements({
        requirements: mockRequirements,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      hook.handleRestoreRequirement('REQ-999');

      expect(mockSetRequirements).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handlePermanentDeleteRequirement', () => {
    it('should permanently delete requirement and clean up references', () => {
      const reqs: Requirement[] = [
        {
          id: 'REQ-001',
          title: 'Parent',
          description: '',
          text: '',
          rationale: '',
          status: 'draft',
          priority: 'high',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
          parentIds: [],
        },
        {
          id: 'REQ-002',
          title: 'Child',
          description: '',
          text: '',
          rationale: '',
          status: 'draft',
          priority: 'medium',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
          parentIds: ['REQ-001'],
        },
      ];

      const hook = useRequirements({
        requirements: reqs,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      hook.handlePermanentDeleteRequirement('REQ-001');

      expect(mockSetRequirements).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDeleteArtifact).toHaveBeenCalledWith('requirements', 'REQ-001');
    });

    it('should filter out deleted requirement from all parent references', () => {
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
          parentIds: [],
        },
        {
          id: 'REQ-002',
          title: 'Child 1',
          description: '',
          text: '',
          rationale: '',
          status: 'draft',
          priority: 'medium',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
          parentIds: ['REQ-001'],
        },
        {
          id: 'REQ-003',
          title: 'Child 2',
          description: '',
          text: '',
          rationale: '',
          status: 'draft',
          priority: 'low',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
          parentIds: ['REQ-001'],
        },
      ];

      let capturedUpdater: any;
      mockSetRequirements.mockImplementation((updater) => {
        capturedUpdater = updater;
      });

      const hook = useRequirements({
        requirements: reqs,
        setRequirements: mockSetRequirements,
        usedReqNumbers,
        setUsedReqNumbers: mockSetUsedReqNumbers,
        setIsEditModalOpen: mockSetIsEditModalOpen,
        setEditingRequirement: mockSetEditingRequirement,
        saveArtifact: mockSaveArtifact,
        deleteArtifact: mockDeleteArtifact,
      });

      hook.handlePermanentDeleteRequirement('REQ-001');

      const result = capturedUpdater(reqs);
      expect(result).toHaveLength(2);
      expect(result.find((r: Requirement) => r.id === 'REQ-002')?.parentIds).toEqual([]);
      expect(result.find((r: Requirement) => r.id === 'REQ-003')?.parentIds).toEqual([]);
      expect(result.find((r: Requirement) => r.id === 'REQ-002')?.revision).toBe('02');
      expect(result.find((r: Requirement) => r.id === 'REQ-003')?.revision).toBe('02');
    });
  });
});
