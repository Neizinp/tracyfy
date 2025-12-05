import type { Information } from '../types';
import { generateNextInfoId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';

interface UseInformationProps {
    information: Information[];
    setInformation: (info: Information[] | ((prev: Information[]) => Information[])) => void;
    usedInfoNumbers: Set<number>;
    setUsedInfoNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;

    setIsInformationModalOpen: (open: boolean) => void;
    setSelectedInformation: (info: Information | null) => void;
    saveArtifact: (type: 'information', id: string, artifact: Information) => Promise<void>;
    deleteArtifact: (type: 'information', id: string) => Promise<void>;
}

export function useInformation({
    information,
    setInformation,
    usedInfoNumbers,
    setUsedInfoNumbers,
    setIsInformationModalOpen,
    setSelectedInformation,
    saveArtifact,
    deleteArtifact
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

        // Save to filesystem
        if (savedInformation) {
            try {
                await saveArtifact('information', savedInformation.id, savedInformation);
            } catch (error) {
                console.error('Failed to save information:', error);
            }
        }
    };

    const handleEditInformation = (info: Information) => {
        setSelectedInformation(info);
        setIsInformationModalOpen(true);
    };

    const handleDeleteInformation = (id: string) => {
        const updatedInfo = information.find(info => info.id === id);
        if (!updatedInfo) return;

        // Soft delete
        const deletedInfo = { ...updatedInfo, isDeleted: true, deletedAt: Date.now() };

        setInformation(information.map(info =>
            info.id === id ? deletedInfo : info
        ));

        // Save soft deleted state
        saveArtifact('information', id, deletedInfo).catch(err =>
            console.error('Failed to save deleted information:', err)
        );
    };

    const handleRestoreInformation = (id: string) => {
        const updatedInfo = information.find(info => info.id === id);
        if (!updatedInfo) return;

        const restoredInfo = { ...updatedInfo, isDeleted: false, deletedAt: undefined };

        setInformation(prev =>
            prev.map(info =>
                info.id === id
                    ? restoredInfo
                    : info
            )
        );

        // Save restored state
        saveArtifact('information', id, restoredInfo).catch(err =>
            console.error('Failed to save restored information:', err)
        );
    };

    const handlePermanentDeleteInformation = (id: string) => {
        setInformation(prev => prev.filter(info => info.id !== id));

        // Delete from filesystem
        deleteArtifact('information', id).catch(err =>
            console.error('Failed to delete information:', err)
        );
    };

    return {
        handleAddInformation,
        handleEditInformation,
        handleDeleteInformation,
        handleRestoreInformation,
        handlePermanentDeleteInformation
    };
}
