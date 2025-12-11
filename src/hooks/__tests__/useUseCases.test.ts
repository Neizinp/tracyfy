import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUseCases } from '../useUseCases';
import type { UseCase, Requirement } from '../../types';

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
    mockUseCases = [
      {
        id: 'UC-001',
        title: 'Test Use Case',
        description: 'Test Description',
        actor: 'User',
        preconditions: 'Logged in',
        mainFlow: 'Step 1\nStep 2',
        alternativeFlows: '',
        postconditions: 'Success',
        status: 'draft',
        priority: 'high',
        revision: '01',
        lastModified: 1000000,
      },
    ];
    mockRequirements = [
      {
        id: 'REQ-001',
        title: 'Test Requirement',
        description: '',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'high',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        useCaseIds: ['UC-001'],
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

    // Mock window.confirm for delete tests
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
  });

  const createHook = () =>
    useUseCases({
      useCases: mockUseCases,
      setUseCases: mockSetUseCases as any,
      usedUcNumbers,
      setUsedUcNumbers: mockSetUsedUcNumbers as any,
      requirements: mockRequirements,
      setRequirements: mockSetRequirements as any,
      setIsUseCaseModalOpen: mockSetIsUseCaseModalOpen as any,
      setEditingUseCase: mockSetEditingUseCase as any,
      saveArtifact: mockSaveArtifact as any,
      deleteArtifact: mockDeleteArtifact as any,
    });

  describe('handleAddUseCase', () => {
    it('should add a new use case with generated ID', async () => {
      const hook = createHook();

      await hook.handleAddUseCase({
        title: 'New Use Case',
        description: 'New Description',
        actor: 'Admin',
        preconditions: '',
        mainFlow: '',
        alternativeFlows: '',
        postconditions: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
      });

      expect(mockSetUsedUcNumbers).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetUseCases).toHaveBeenCalled();
      expect(mockSetIsUseCaseModalOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('handleEditUseCase', () => {
    it('should open modal with use case for editing', () => {
      const hook = createHook();

      hook.handleEditUseCase(mockUseCases[0]);

      expect(mockSetEditingUseCase).toHaveBeenCalledWith(mockUseCases[0]);
      expect(mockSetIsUseCaseModalOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDeleteUseCase', () => {
    it('should permanently delete a use case when confirmed', () => {
      const hook = createHook();

      hook.handleDeleteUseCase('UC-001');

      expect(mockSetUseCases).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetRequirements).toHaveBeenCalled();
      expect(mockDeleteArtifact).toHaveBeenCalledWith('usecases', 'UC-001');
    });

    it('should not delete if user cancels confirmation', () => {
      vi.stubGlobal(
        'confirm',
        vi.fn(() => false)
      );

      const hook = createHook();

      hook.handleDeleteUseCase('UC-001');

      expect(mockSetUseCases).not.toHaveBeenCalled();
      expect(mockDeleteArtifact).not.toHaveBeenCalled();
    });
  });
});
