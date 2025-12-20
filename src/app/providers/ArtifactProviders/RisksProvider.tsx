import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { riskService } from '../../../services/artifactServices';
import { useFileSystem } from '../FileSystemProvider';
import { useToast } from '../ToastProvider';
import { useUI } from '../UIProvider';
import { useUser } from '../UserProvider';
import { debug } from '../../../utils/debug';
import type { Risk, CommitInfo } from '../../../types';
import { realGitService } from '../../../services/realGitService';

interface RisksContextValue {
  risks: Risk[];
  loading: boolean;
  saveRisk: (risk: Risk) => Promise<void>;
  deleteRisk: (id: string) => Promise<void>;
  refreshRisks: () => Promise<void>;
  getRiskHistory: (id: string) => Promise<CommitInfo[]>;

  // UI helpers (compatible with old provider)
  handleAddRisk: (risk: Omit<Risk, 'id' | 'lastModified'>) => Promise<void>;
  handleUpdateRisk: (id: string, data: Partial<Risk>) => Promise<void>;
  handleDeleteRisk: (id: string) => void;
  handlePermanentDeleteRisk: (id: string) => void;
  handleEdit: (risk: Risk) => void;
}

const RisksContext = createContext<RisksContextValue | undefined>(undefined);

export const RisksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(false);
  const { isReady, refreshStatus, getNextId } = useFileSystem();
  const { showToast } = useToast();
  const { setEditingRisk, setIsRiskModalOpen } = useUI();
  const { currentUser } = useUser();
  const hasLoadedInitial = useRef(false);

  // Check if we're in E2E test mode
  const isE2E =
    typeof window !== 'undefined' &&
    (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;

  const refreshRisks = useCallback(async () => {
    if (!isReady && !isE2E) return;

    setLoading(true);
    try {
      const loadedRisks = await riskService.loadAll();
      setRisks(loadedRisks);
    } catch (error) {
      console.error('Failed to load risks:', error);
      showToast('Failed to load risks', 'error');
    } finally {
      setLoading(false);
    }
  }, [isReady, isE2E, showToast]);

  useEffect(() => {
    if ((isReady || isE2E) && !hasLoadedInitial.current) {
      refreshRisks();
      hasLoadedInitial.current = true;
    }
  }, [isReady, isE2E, refreshRisks]);

  const saveRisk = useCallback(
    async (risk: Risk) => {
      debug.log('[RisksProvider] Saving risk:', risk.id);

      try {
        if (!isE2E) {
          await riskService.save(risk);
        }

        setRisks((prev) => {
          const idx = prev.findIndex((r) => r.id === risk.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = risk;
            return updated;
          }
          return [...prev, risk];
        });

        if (!isE2E) {
          await refreshStatus();
        }

        showToast(`Risk ${risk.id} saved`, 'success');
      } catch (error) {
        console.error('Failed to save risk:', error);
        showToast('Failed to save risk', 'error');
        throw error;
      }
    },
    [isE2E, refreshStatus, showToast]
  );

  const deleteRisk = useCallback(
    async (id: string) => {
      debug.log('[RisksProvider] Deleting risk:', id);

      try {
        if (!isE2E) {
          await riskService.delete(id);
        }

        setRisks((prev) => prev.filter((r) => r.id !== id));

        if (!isE2E) {
          await refreshStatus();
        }

        showToast('Risk deleted', 'success');
      } catch (error) {
        console.error('Failed to delete risk:', error);
        showToast('Failed to delete risk', 'error');
        throw error;
      }
    },
    [isE2E, refreshStatus, showToast]
  );

  const getRiskHistory = useCallback(
    async (id: string) => {
      if ((!isReady || !realGitService.isInitialized()) && !isE2E) return [];
      return await realGitService.getHistory(`risks/${id}.md`);
    },
    [isReady, isE2E]
  );

  // UI helpers
  const handleAddRisk = useCallback(
    async (newRiskData: Omit<Risk, 'id' | 'lastModified'>) => {
      if (!currentUser && !isE2E) {
        showToast('Please select a user before creating artifacts.', 'warning');
        return;
      }

      const newId = await getNextId('risks');
      const newRisk: Risk = {
        ...newRiskData,
        id: newId,
        lastModified: Date.now(),
      };

      await saveRisk(newRisk);
    },
    [currentUser, getNextId, saveRisk, showToast, isE2E]
  );

  const handleUpdateRisk = useCallback(
    async (id: string, updatedData: Partial<Risk>) => {
      const existingRisk = risks.find((r) => r.id === id);
      if (!existingRisk) return;

      const finalRisk: Risk = {
        ...existingRisk,
        ...updatedData,
        lastModified: Date.now(),
      };

      await saveRisk(finalRisk);
      setIsRiskModalOpen(false);
      setEditingRisk(null);
    },
    [risks, saveRisk, setIsRiskModalOpen, setEditingRisk]
  );

  const handleDeleteRisk = useCallback(
    (id: string) => {
      const existingRisk = risks.find((r) => r.id === id);
      if (!existingRisk) return;

      const deletedRisk: Risk = {
        ...existingRisk,
        isDeleted: true,
        deletedAt: Date.now(),
      };

      saveRisk(deletedRisk).catch((err) => console.error('Failed to soft-delete risk:', err));
    },
    [risks, saveRisk]
  );

  const handlePermanentDeleteRisk = useCallback(
    (id: string) => {
      deleteRisk(id).catch((err) => console.error('Failed to permanently delete risk:', err));
    },
    [deleteRisk]
  );

  const handleEdit = useCallback(
    (risk: Risk) => {
      setEditingRisk(risk);
      setIsRiskModalOpen(true);
    },
    [setEditingRisk, setIsRiskModalOpen]
  );

  const value: RisksContextValue = {
    risks,
    loading,
    saveRisk,
    deleteRisk,
    refreshRisks,
    getRiskHistory,
    handleAddRisk,
    handleUpdateRisk,
    handleDeleteRisk,
    handlePermanentDeleteRisk,
    handleEdit,
  };

  return <RisksContext.Provider value={value}>{children}</RisksContext.Provider>;
};

export const useRisks = () => {
  const context = useContext(RisksContext);
  if (context === undefined) {
    throw new Error('useRisks must be used within a RisksProvider');
  }
  return context;
};
