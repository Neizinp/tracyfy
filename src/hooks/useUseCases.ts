import type { UseCase, Requirement } from '../types';
import { generateNextUcId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';

interface UseUseCasesProps {
  useCases: UseCase[];
  setUseCases: (ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => void;
  usedUcNumbers: Set<number>;
  setUsedUcNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;

  setIsUseCaseModalOpen: (open: boolean) => void;
  setEditingUseCase: (uc: UseCase | null) => void;
  saveArtifact: (type: 'usecases', id: string, artifact: UseCase) => Promise<void>;
  deleteArtifact: (type: 'usecases', id: string) => Promise<void>;
}

export function useUseCases({
  useCases,
  setUseCases,
  usedUcNumbers,
  setUsedUcNumbers,
  requirements,
  setRequirements,
  setIsUseCaseModalOpen,
  setEditingUseCase,
  saveArtifact,
  deleteArtifact,
}: UseUseCasesProps) {
  const handleAddUseCase = async (
    data: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => {
    let savedUseCase: UseCase | null = null;

    if ('id' in data) {
      // Update existing
      const updatedUseCase = useCases.find((uc) => uc.id === data.id);
      if (!updatedUseCase) return;

      // Increment revision
      const newRevision = incrementRevision(updatedUseCase.revision || '01');
      const finalUseCase = {
        ...updatedUseCase,
        ...data.updates,
        revision: newRevision,
        lastModified: Date.now(),
      };

      setUseCases((prev) => prev.map((u) => (u.id === finalUseCase.id ? finalUseCase : u)));
      savedUseCase = finalUseCase;
      setEditingUseCase(null);
    } else {
      const newId = generateNextUcId(usedUcNumbers);
      const newUseCase: UseCase = {
        ...data,
        id: newId,
        lastModified: Date.now(),
      } as UseCase;

      // Mark this number as used (extract number from ID)
      const idNumber = parseInt(newId.split('-')[1], 10);
      setUsedUcNumbers((prev) => new Set(prev).add(idNumber));
      setUseCases([...useCases, newUseCase]);
      savedUseCase = newUseCase;
    }
    setIsUseCaseModalOpen(false);

    // Save to filesystem
    if (savedUseCase) {
      try {
        await saveArtifact('usecases', savedUseCase.id, savedUseCase);
      } catch (error) {
        console.error('Failed to save use case:', error);
      }
    }
  };

  const handleEditUseCase = (useCase: UseCase) => {
    setEditingUseCase(useCase);
    setIsUseCaseModalOpen(true);
  };

  const handleDeleteUseCase = (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this use case? Requirements linked to it will not be deleted.'
      )
    ) {
      const updatedUseCase = useCases.find((uc) => uc.id === id);
      if (!updatedUseCase) return;

      // Soft delete
      const deletedUseCase = { ...updatedUseCase, isDeleted: true, deletedAt: Date.now() };

      setUseCases((prev) => prev.map((uc) => (uc.id === id ? deletedUseCase : uc)));

      // Remove use case references from requirements
      setRequirements(
        requirements.map((req) => ({
          ...req,
          useCaseIds: req.useCaseIds?.filter((ucId) => ucId !== id),
          lastModified: Date.now(),
          revision: req.useCaseIds?.includes(id)
            ? incrementRevision(req.revision || '01')
            : req.revision,
        }))
      );

      // Save soft deleted state
      saveArtifact('usecases', id, deletedUseCase).catch((err) =>
        console.error('Failed to save deleted use case:', err)
      );
    }
  };

  const handleRestoreUseCase = (id: string) => {
    const updatedUseCase = useCases.find((uc) => uc.id === id);
    if (!updatedUseCase) return;

    const restoredUseCase = { ...updatedUseCase, isDeleted: false, deletedAt: undefined };

    setUseCases((prev) => prev.map((uc) => (uc.id === id ? restoredUseCase : uc)));

    // Save restored state
    saveArtifact('usecases', id, restoredUseCase).catch((err) =>
      console.error('Failed to save restored use case:', err)
    );
  };

  const handlePermanentDeleteUseCase = (id: string) => {
    setUseCases((prev) => prev.filter((uc) => uc.id !== id));

    // Delete from filesystem
    deleteArtifact('usecases', id).catch((err) => console.error('Failed to delete use case:', err));
  };

  return {
    handleAddUseCase,
    handleEditUseCase,
    handleDeleteUseCase,
    handleRestoreUseCase,
    handlePermanentDeleteUseCase,
  };
}
