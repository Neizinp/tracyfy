import type { UseCase, Requirement, Project } from '../types';
import { generateNextUcId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';
import { gitService } from '../services/gitService';

interface UseUseCasesProps {
    useCases: UseCase[];
    setUseCases: (ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => void;
    usedUcNumbers: Set<number>;
    setUsedUcNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
    requirements: Requirement[];
    setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
    projects: Project[];
    currentProjectId: string;
    setIsUseCaseModalOpen: (open: boolean) => void;
    setEditingUseCase: (uc: UseCase | null) => void;
}

export function useUseCases({
    useCases,
    setUseCases,
    usedUcNumbers,
    setUsedUcNumbers,
    requirements,
    setRequirements,
    projects,
    currentProjectId,
    setIsUseCaseModalOpen,
    setEditingUseCase
}: UseUseCasesProps) {

    const handleAddUseCase = async (data: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }) => {
        let savedUseCase: UseCase | null = null;

        if ('id' in data) {
            // Update existing
            const updatedUseCase = useCases.find(uc => uc.id === data.id);
            if (!updatedUseCase) return;

            // Increment revision
            const newRevision = incrementRevision(updatedUseCase.revision || '01');
            const finalUseCase = {
                ...updatedUseCase,
                ...data.updates,
                revision: newRevision,
                lastModified: Date.now()
            };

            setUseCases(prev => prev.map(u =>
                u.id === finalUseCase.id ? finalUseCase : u
            ));
            savedUseCase = finalUseCase;
            setEditingUseCase(null);
        } else {
            const newId = generateNextUcId(usedUcNumbers);
            const newUseCase: UseCase = {
                ...data,
                id: newId,
                lastModified: Date.now()
            } as UseCase;

            // Mark this number as used (extract number from ID)
            const idNumber = parseInt(newId.split('-')[1], 10);
            setUsedUcNumbers(prev => new Set(prev).add(idNumber));
            setUseCases([...useCases, newUseCase]);
            savedUseCase = newUseCase;
        }
        setIsUseCaseModalOpen(false);

        // Save to git repository to make it appear in Pending Changes
        if (savedUseCase) {
            try {
                const project = projects.find(p => p.id === currentProjectId);
                if (project) {
                    await gitService.saveArtifact('usecases', savedUseCase);
                    await gitService.commitArtifact(
                        'usecases',
                        savedUseCase.id,
                        `Update use case ${savedUseCase.id}: ${savedUseCase.title} (Rev ${savedUseCase.revision})`
                    );
                }
            } catch (error) {
                console.error('Failed to save use case to git:', error);
            }
        }
    };

    const handleEditUseCase = (useCase: UseCase) => {
        setEditingUseCase(useCase);
        setIsUseCaseModalOpen(true);
    };

    const handleDeleteUseCase = (id: string) => {
        if (confirm('Are you sure you want to delete this use case? Requirements linked to it will not be deleted.')) {
            setUseCases(useCases.filter(uc => uc.id !== id));
            // Remove use case references from requirements
            setRequirements(requirements.map(req => ({
                ...req,
                useCaseIds: req.useCaseIds?.filter(ucId => ucId !== id),
                lastModified: Date.now(),
                revision: req.useCaseIds?.includes(id) ? incrementRevision(req.revision || "01") : req.revision
            })));
        }
    };

    const handleRestoreUseCase = (id: string) => {
        setUseCases(prev =>
            prev.map(uc =>
                uc.id === id
                    ? { ...uc, isDeleted: false, deletedAt: undefined }
                    : uc
            )
        );
    };

    const handlePermanentDeleteUseCase = (id: string) => {
        setUseCases(prev => prev.filter(uc => uc.id !== id));
    };

    return {
        handleAddUseCase,
        handleEditUseCase,
        handleDeleteUseCase,
        handleRestoreUseCase,
        handlePermanentDeleteUseCase
    };
}
