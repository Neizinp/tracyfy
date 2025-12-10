import type { Requirement } from '../types';
import { generateNextReqId } from '../utils/idGenerationUtils';
import { incrementRevision } from '../utils/revisionUtils';

interface UseRequirementsProps {
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
  usedReqNumbers: Set<number>;
  setUsedReqNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  setIsEditModalOpen: (open: boolean) => void;
  setEditingRequirement: (req: Requirement | null) => void;
  saveArtifact: (type: 'requirements', id: string, artifact: Requirement) => Promise<void>;
  deleteArtifact: (type: 'requirements', id: string) => Promise<void>;
}

export function useRequirements({
  requirements,
  setRequirements,
  usedReqNumbers,
  setUsedReqNumbers,
  setIsEditModalOpen,
  setEditingRequirement,
  saveArtifact,
  deleteArtifact,
}: UseRequirementsProps) {
  const handleAddRequirement = async (newReqData: Omit<Requirement, 'id' | 'lastModified'>) => {
    const newId = generateNextReqId(usedReqNumbers);

    const newRequirement: Requirement = {
      ...newReqData,
      id: newId,
      lastModified: Date.now(),
    };

    // Mark this number as used (extract number from ID)
    const idNumber = parseInt(newId.split('-')[1], 10);
    setUsedReqNumbers((prev) => new Set(prev).add(idNumber));
    setRequirements([...requirements, newRequirement]);

    // Save to filesystem
    try {
      await saveArtifact('requirements', newRequirement.id, newRequirement);
    } catch (error) {
      console.error('Failed to save requirement:', error);
    }
  };

  const handleUpdateRequirement = async (id: string, updatedData: Partial<Requirement>) => {
    const updatedReq = requirements.find((req) => req.id === id);
    if (!updatedReq) return;

    // Increment revision
    const newRevision = incrementRevision(updatedReq.revision || '01');
    const finalRequirement = {
      ...updatedReq,
      ...updatedData,
      revision: newRevision,
      lastModified: Date.now(),
    };

    // Update local state
    setRequirements((prev) =>
      prev.map((r) => (r.id === finalRequirement.id ? finalRequirement : r))
    );
    setIsEditModalOpen(false);
    setEditingRequirement(null);

    // Save to filesystem
    try {
      await saveArtifact('requirements', finalRequirement.id, finalRequirement);
    } catch (error) {
      console.error('Failed to save requirement:', error);
    }
  };

  const handleDeleteRequirement = (id: string) => {
    // Soft delete: Mark as deleted instead of removing
    const updatedReq = requirements.find((req) => req.id === id);
    if (!updatedReq) return;

    const deletedReq = { ...updatedReq, isDeleted: true, deletedAt: Date.now() };

    setRequirements((prev) => prev.map((req) => (req.id === id ? deletedReq : req)));

    // Close modal if open
    setIsEditModalOpen(false);
    setEditingRequirement(null);

    // Save the soft-deleted state to filesystem
    // We still save it because soft-delete is just a state change
    saveArtifact('requirements', id, deletedReq).catch((err) =>
      console.error('Failed to save deleted requirement:', err)
    );
  };

  const handleRestoreRequirement = (id: string) => {
    const updatedReq = requirements.find((req) => req.id === id);
    if (!updatedReq) return;

    const restoredReq = { ...updatedReq, isDeleted: false, deletedAt: undefined };

    setRequirements((prev) => prev.map((req) => (req.id === id ? restoredReq : req)));

    // Save restored state
    saveArtifact('requirements', id, restoredReq).catch((err) =>
      console.error('Failed to save restored requirement:', err)
    );
  };

  const handlePermanentDeleteRequirement = (id: string) => {
    setRequirements((prev) =>
      prev
        .filter((req) => req.id !== id)
        .map((req) => ({
          ...req,
          parentIds: req.parentIds ? req.parentIds.filter((parentId) => parentId !== id) : [],
          lastModified: Date.now(),
          revision: req.parentIds?.includes(id)
            ? incrementRevision(req.revision || '01')
            : req.revision,
        }))
    );

    // Delete from filesystem
    deleteArtifact('requirements', id).catch((err) =>
      console.error('Failed to delete requirement:', err)
    );
  };

  return {
    handleAddRequirement,
    handleUpdateRequirement,
    handleDeleteRequirement,
    handleRestoreRequirement,
    handlePermanentDeleteRequirement,
  };
}
