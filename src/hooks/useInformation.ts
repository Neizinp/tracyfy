import type { Information, Project } from '../types';
import { generateNextInfoId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';
import { gitService } from '../services/gitService';

interface UseInformationProps {
    information: Information[];
    setInformation: (info: Information[] | ((prev: Information[]) => Information[])) => void;
    usedInfoNumbers: Set<number>;
    setUsedInfoNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
    projects: Project[];
    currentProjectId: string;
    setIsInformationModalOpen: (open: boolean) => void;
    setSelectedInformation: (info: Information | null) => void;
}

export function useInformation({
    information,
    setInformation,
    usedInfoNumbers,
    setUsedInfoNumbers,
    projects,
    currentProjectId,
    setIsInformationModalOpen,
    setSelectedInformation
}: UseInformationProps) {

    const handleAddInformation = async (data: Omit<Information, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Information> }) => {
        let savedInformation: Information | null = null;

        if ('id' in data) {
            // Update existing
            const updatedInfo = information.find(info => info.id === data.id);
            if (!updatedInfo) return;

            // Increment revision
            const newRevision = incrementRevision(updatedInfo.revision || '01');
            const finalInfo = {
                ...updatedInfo,
                ...data.updates,
                revision: newRevision,
                lastModified: Date.now()
            };

            setInformation(prev => prev.map(i =>
                i.id === finalInfo.id ? finalInfo : i
            ));
            savedInformation = finalInfo;
            setSelectedInformation(null);
        } else {
            const newInformation: Information = {
                ...data,
                id: generateNextInfoId(usedInfoNumbers),
                dateCreated: Date.now(),
                lastModified: Date.now()
            };

            setInformation([...information, newInformation]);
            // Mark this number as used (extract number from ID)
            const idNumber = parseInt(newInformation.id.split('-')[1], 10);
            setUsedInfoNumbers(new Set([...usedInfoNumbers, idNumber]));
            savedInformation = newInformation;
        }
        setIsInformationModalOpen(false);

        // Save to git repository to make it appear in Pending Changes
        if (savedInformation) {
            try {
                const project = projects.find(p => p.id === currentProjectId);
                if (project) {
                    await gitService.saveArtifact('information', savedInformation);
                }
            } catch (error) {
                console.error('Failed to save information to git:', error);
            }
        }
    };

    const handleEditInformation = (info: Information) => {
        setSelectedInformation(info);
        setIsInformationModalOpen(true);
    };

    const handleDeleteInformation = (id: string) => {
        setInformation(information.map(info =>
            info.id === id ? { ...info, isDeleted: true, deletedAt: Date.now() } : info
        ));
    };

    const handleRestoreInformation = (id: string) => {
        setInformation(prev =>
            prev.map(info =>
                info.id === id
                    ? { ...info, isDeleted: false, deletedAt: undefined }
                    : info
            )
        );
    };

    const handlePermanentDeleteInformation = (id: string) => {
        setInformation(prev => prev.filter(info => info.id !== id));
    };

    return {
        handleAddInformation,
        handleEditInformation,
        handleDeleteInformation,
        handleRestoreInformation,
        handlePermanentDeleteInformation
    };
}
