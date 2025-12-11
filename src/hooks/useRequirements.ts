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
    // Permanent delete: Remove from state and filesystem
    setRequirements((prev) => prev.filter((req) => req.id !== id));

    // Close modal if open
    setIsEditModalOpen(false);
    setEditingRequirement(null);

    // Delete from filesystem
    deleteArtifact('requirements', id).catch((err) =>
      console.error('Failed to delete requirement:', err)
    );
  };

  return {
    handleAddRequirement,
    handleUpdateRequirement,
    handleDeleteRequirement,
  };
}
