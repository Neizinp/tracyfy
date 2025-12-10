import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUseCases } from '../useUseCases';
import type { UseCase, Requirement } from '../../types';

// Mock window.confirm
vi.stubGlobal(
  'confirm',
  vi.fn(() => true)
);

describe('useUseCases', () => {
  let mockUseCases: UseCase[];
  let mockRequirements: Requirement[];
  let mockSetUseCases: ReturnType<typeof vi.fn>;
  let mockSetRequirements: ReturnType<typeof vi.fn>;
  let mockSetUsedUcNumbers: ReturnType<typeof vi.fn>;
  let mockSetIsUseCaseModalOpen: ReturnType<typeof vi.fn>;
  let mockSetEditingUseCase: ReturnType<typeof vi.fn>;
  let mockSaveArtifact: ReturnType<typeof vi.fn>;
  let mockDeleteArtifact: ReturnType<typeof vi.fn>;
  let usedUcNumbers: Set<number>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCases = [
      {
        id: 'UC-001',
        title: 'Use Case 1',
        description: 'Description',
        actor: 'User',
        preconditions: '',
        mainFlow: '',
        alternativeFlows: '',
        postconditions: '',
        status: 'draft',
        priority: 'high',
        revision: '01',
        lastModified: 1000000,
        linkedArtifacts: [],
        isDeleted: false,
      },
    ];
    mockRequirements = [
      {
        id: 'REQ-001',
        title: 'Requirement 1',
        text: 'Text',
        status: 'draft',
        priority: 'high',
        description: '',
        rationale: '',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        linkedArtifacts: [],
        useCaseIds: ['UC-001'],
        isDeleted: false,
      },
    ];
    usedUcNumbers = new Set([1]);
    mockSetUseCases = vi.fn();
    mockSetRequirements = vi.fn();
    mockSetUsedUcNumbers = vi.fn();
    mockSetIsUseCaseModalOpen = vi.fn();
    mockSetEditingUseCase = vi.fn();
    mockSaveArtifact = vi.fn().mockResolvedValue(undefined);
    mockDeleteArtifact = vi.fn().mockResolvedValue(undefined);
  });

  const createHook = () =>
    useUseCases({
      useCases: mockUseCases,
      setUseCases: mockSetUseCases,
      usedUcNumbers,
      setUsedUcNumbers: mockSetUsedUcNumbers,
      requirements: mockRequirements,
      setRequirements: mockSetRequirements,
      setIsUseCaseModalOpen: mockSetIsUseCaseModalOpen,
      setEditingUseCase: mockSetEditingUseCase,
      saveArtifact: mockSaveArtifact,
      deleteArtifact: mockDeleteArtifact,
    });

  describe('handleAddUseCase', () => {
    it('should add a new use case with generated ID', async () => {
      const hook = createHook();

      await hook.handleAddUseCase({
        title: 'New Use Case',
        description: 'New Description',
        actor: 'Admin',
        preconditions: 'Logged in',
        mainFlow: 'Step 1',
        alternativeFlows: '',
        postconditions: 'Success',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        linkedArtifacts: [],
      });

      expect(mockSetUseCases).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'UC-002',
            title: 'New Use Case',
            description: 'New Description',
            actor: 'Admin',
          }),
        ])
      );
      expect(mockSetUsedUcNumbers).toHaveBeenCalled();
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'usecases',
        'UC-002',
        expect.objectContaining({
          id: 'UC-002',
          title: 'New Use Case',
        })
      );
      expect(mockSetIsUseCaseModalOpen).toHaveBeenCalledWith(false);
    });

    it('should set lastModified timestamp on new use case', async () => {
      const hook = createHook();
      const beforeTime = Date.now();

      await hook.handleAddUseCase({
        title: 'New Use Case',
        description: 'Description',
        actor: 'User',
        preconditions: '',
        mainFlow: '',
        alternativeFlows: '',
        postconditions: '',
        status: 'draft',
        priority: 'high',
        revision: '01',
        linkedArtifacts: [],
      });

      const afterTime = Date.now();
      const savedUseCase = mockSaveArtifact.mock.calls[0][2] as UseCase;
      expect(savedUseCase.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(savedUseCase.lastModified).toBeLessThanOrEqual(afterTime);
    });

    it('should update existing use case when id is provided', async () => {
      const hook = createHook();

      await hook.handleAddUseCase({
        id: 'UC-001',
        updates: {
          title: 'Updated Title',
          description: 'Updated Description',
        },
      });

      expect(mockSetUseCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'usecases',
        'UC-001',
        expect.objectContaining({
          id: 'UC-001',
          title: 'Updated Title',
          revision: '02',
        })
      );
      expect(mockSetEditingUseCase).toHaveBeenCalledWith(null);
    });

    it('should increment revision on update', async () => {
      const hook = createHook();

      await hook.handleAddUseCase({
        id: 'UC-001',
        updates: { title: 'Updated' },
      });

      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'usecases',
        'UC-001',
        expect.objectContaining({
          revision: '02',
        })
      );
    });

    it('should not update if use case not found', async () => {
      const hook = createHook();

      await hook.handleAddUseCase({
        id: 'UC-999',
        updates: { title: 'Updated' },
      });

      expect(mockSetUseCases).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveArtifact.mockRejectedValue(new Error('Save failed'));

      const hook = createHook();

      await hook.handleAddUseCase({
        title: 'New Use Case',
        description: '',
        actor: '',
        preconditions: '',
        mainFlow: '',
        alternativeFlows: '',
        postconditions: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        linkedArtifacts: [],
      });

      expect(consoleError).toHaveBeenCalledWith('Failed to save use case:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  describe('handleEditUseCase', () => {
    it('should set editing use case and open modal', () => {
      const hook = createHook();

      hook.handleEditUseCase(mockUseCases[0]);

      expect(mockSetEditingUseCase).toHaveBeenCalledWith(mockUseCases[0]);
      expect(mockSetIsUseCaseModalOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDeleteUseCase', () => {
    it('should soft delete a use case when confirmed', () => {
      const hook = createHook();

      hook.handleDeleteUseCase('UC-001');

      expect(mockSetUseCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'usecases',
        'UC-001',
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Number),
        })
      );
    });

    it('should remove use case references from requirements on delete', () => {
      const hook = createHook();

      hook.handleDeleteUseCase('UC-001');

      expect(mockSetRequirements).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'REQ-001',
            useCaseIds: [],
          }),
        ])
      );
    });

    it('should increment requirement revision when use case link is removed', () => {
      const hook = createHook();

      hook.handleDeleteUseCase('UC-001');

      const updatedReqs = mockSetRequirements.mock.calls[0][0] as Requirement[];
      expect(updatedReqs[0].revision).toBe('02');
    });

    it('should not delete if use case not found', () => {
      const hook = createHook();

      hook.handleDeleteUseCase('UC-999');

      expect(mockSetUseCases).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });

    it('should not delete if user cancels confirmation', () => {
      vi.stubGlobal(
        'confirm',
        vi.fn(() => false)
      );
      const hook = createHook();

      hook.handleDeleteUseCase('UC-001');

      expect(mockSetUseCases).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handleRestoreUseCase', () => {
    it('should restore a soft-deleted use case', () => {
      mockUseCases[0].isDeleted = true;
      mockUseCases[0].deletedAt = Date.now();

      const hook = createHook();

      hook.handleRestoreUseCase('UC-001');

      expect(mockSetUseCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'usecases',
        'UC-001',
        expect.objectContaining({
          isDeleted: false,
          deletedAt: undefined,
        })
      );
    });

    it('should not restore if use case not found', () => {
      const hook = createHook();

      hook.handleRestoreUseCase('UC-999');

      expect(mockSetUseCases).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });
  });

  describe('handlePermanentDeleteUseCase', () => {
    it('should permanently delete use case', () => {
      const hook = createHook();

      hook.handlePermanentDeleteUseCase('UC-001');

      expect(mockSetUseCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDeleteArtifact).toHaveBeenCalledWith('usecases', 'UC-001');
    });

    it('should remove use case from array', () => {
      let capturedUpdater: any;
      mockSetUseCases.mockImplementation((updater) => {
        capturedUpdater = updater;
      });

      const hook = createHook();

      hook.handlePermanentDeleteUseCase('UC-001');

      const result = capturedUpdater(mockUseCases);
      expect(result).toEqual([]);
    });

    it('should handle delete errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteArtifact.mockRejectedValue(new Error('Delete failed'));

      const hook = createHook();

      await hook.handlePermanentDeleteUseCase('UC-001');

      expect(consoleError).toHaveBeenCalledWith('Failed to delete use case:', expect.any(Error));
      consoleError.mockRestore();
    });
  });
});
