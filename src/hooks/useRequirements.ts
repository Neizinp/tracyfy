import type { Requirement, Link, Project } from '../types';
import { generateNextReqId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';
import { gitService } from '../services/gitService';

interface UseRequirementsProps {
    requirements: Requirement[];
    setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
    usedReqNumbers: Set<number>;
    setUsedReqNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
    links: Link[];
    setLinks: (links: Link[] | ((prev: Link[]) => Link[])) => void;
    projects: Project[];
    currentProjectId: string;
    setIsEditModalOpen: (open: boolean) => void;
    setEditingRequirement: (req: Requirement | null) => void;
}

export function useRequirements({
    requirements,
    setRequirements,
    usedReqNumbers,
    setUsedReqNumbers,
    links,
    setLinks,
    projects,
    currentProjectId,
    setIsEditModalOpen,
    setEditingRequirement
}: UseRequirementsProps) {

    const handleAddRequirement = async (newReqData: Omit<Requirement, 'id' | 'lastModified'>) => {
        const newId = generateNextReqId(usedReqNumbers);

        const newRequirement: Requirement = {
            ...newReqData,
            id: newId,
            lastModified: Date.now()
        };

        // Mark this number as used (extract number from ID)
        const idNumber = parseInt(newId.split('-')[1], 10);
        setUsedReqNumbers(prev => new Set(prev).add(idNumber));
        setRequirements([...requirements, newRequirement]);

        // Save to git repository to make it appear in Pending Changes
        try {
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                await gitService.saveArtifact('requirements', newRequirement);
            }
        } catch (error) {
            console.error('Failed to save requirement to git:', error);
        }
    };

    const handleUpdateRequirement = async (id: string, updatedData: Partial<Requirement>) => {
        const updatedReq = requirements.find(req => req.id === id);
        if (!updatedReq) return;

        // Increment revision
        const newRevision = incrementRevision(updatedReq.revision || '01');
        const finalRequirement = {
            ...updatedReq,
            ...updatedData,
            revision: newRevision,
            lastModified: Date.now()
        };

        // Update local state
        setRequirements(prev => prev.map(r =>
            r.id === finalRequirement.id ? finalRequirement : r
        ));
        setIsEditModalOpen(false);
        setEditingRequirement(null);

        // Save to git repository to make it appear in Pending Changes
        try {
            const project = projects.find(p => p.id === currentProjectId);
            if (project) {
                await gitService.saveArtifact('requirements', finalRequirement);
                await gitService.commitArtifact(
                    'requirements',
                    finalRequirement.id,
                    `Update requirement ${finalRequirement.id}: ${finalRequirement.title} (Rev ${newRevision})`
                );
            }
        } catch (error) {
            console.error('Failed to save requirement to git:', error);
        }
    };

    const handleDeleteRequirement = (id: string) => {
        // Soft delete: Mark as deleted instead of removing
        setRequirements(prev =>
            prev.map(req =>
                req.id === id
                    ? { ...req, isDeleted: true, deletedAt: Date.now() }
                    : req
            )
        );

        // Close modal if open
        setIsEditModalOpen(false);
        setEditingRequirement(null);
    };

    const handleRestoreRequirement = (id: string) => {
        setRequirements(prev =>
            prev.map(req =>
                req.id === id
                    ? { ...req, isDeleted: false, deletedAt: undefined }
                    : req
            )
        );
    };

    const handlePermanentDeleteRequirement = (id: string) => {
        setRequirements(prev =>
            prev
                .filter(req => req.id !== id)
                .map(req => ({
                    ...req,
                    parentIds: req.parentIds ? req.parentIds.filter(parentId => parentId !== id) : [],
                    lastModified: Date.now(),
                    revision: req.parentIds?.includes(id) ? incrementRevision(req.revision || "01") : req.revision
                }))
        );
        setLinks(prev => prev.filter(link => link.sourceId !== id && link.targetId !== id));
    };

    return {
        handleAddRequirement,
        handleUpdateRequirement,
        handleDeleteRequirement,
        handleRestoreRequirement,
        handlePermanentDeleteRequirement
    };
}
