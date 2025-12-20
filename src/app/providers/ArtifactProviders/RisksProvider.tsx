import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { debug } from '../../../utils/debug';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import type { Risk } from '../../../types';
import { riskService } from '../../../services/artifactServices';

interface RisksContextValue {
  // Data
  risks: Risk[];
  setRisks: (risks: Risk[] | ((prev: Risk[]) => Risk[])) => void;

  // CRUD operations
  handleAddRisk: (risk: Omit<Risk, 'id' | 'lastModified'>) => Promise<void>;
  handleUpdateRisk: (id: string, data: Partial<Risk>) => Promise<void>;
  handleDeleteRisk: (id: string) => void;
  handleRestoreRisk: (id: string) => void;
  handlePermanentDeleteRisk: (id: string) => void;

  // Page handlers
  handleEdit: (risk: Risk) => void;
}

const RisksContext = createContext<RisksContextValue | undefined>(undefined);

export const RisksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const globalState = useGlobalState();
  const { risks, setRisks } = globalState;
  const { setEditingRisk, setIsRiskModalOpen } = useUI();
  const { isReady, getNextId } = useFileSystem();
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const hasSyncedInitial = useRef(false);

  // Sync risks from riskService on initial load
  useEffect(() => {
    const loadRisks = async () => {
      if (isReady && !hasSyncedInitial.current) {
        debug.log('[RisksProvider] Syncing from disk...');
        const loadedRisks = await riskService.loadAll();
        setRisks(loadedRisks);
        hasSyncedInitial.current = true;
      }
    };
    loadRisks();
  }, [isReady, setRisks]);

  const handleAddRisk = useCallback(
    async (newRiskData: Omit<Risk, 'id' | 'lastModified'>) => {
      if (!currentUser) {
        showToast(
          'Please select a user before creating artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return;
      }

      const newId = await getNextId('risks');

      const newRisk: Risk = {
        ...newRiskData,
        id: newId,
        lastModified: Date.now(),
      };

      setRisks((prev) => [...prev, newRisk]);

      try {
        await riskService.save(newRisk, `Risk created: ${newRisk.title}`);
      } catch (error) {
        console.error('Failed to save risk:', error);
      }
    },
    [currentUser, getNextId, setRisks, showToast]
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

      setRisks((prev) => prev.map((r) => (r.id === id ? finalRisk : r)));
      setIsRiskModalOpen(false);
      setEditingRisk(null);

      try {
        await riskService.save(finalRisk, `Risk updated: ${finalRisk.title}`);
      } catch (error) {
        console.error('Failed to save risk:', error);
      }
    },
    [risks, setRisks, setEditingRisk, setIsRiskModalOpen]
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

      setRisks((prev) => prev.map((r) => (r.id === id ? deletedRisk : r)));
      setIsRiskModalOpen(false);
      setEditingRisk(null);

      riskService
        .save(deletedRisk, `Risk soft-deleted: ${id}`)
        .catch((err) => console.error('Failed to soft-delete risk:', err));
    },
    [risks, setRisks, setEditingRisk, setIsRiskModalOpen]
  );

  const handleRestoreRisk = useCallback(
    (id: string) => {
      const existingRisk = risks.find((r) => r.id === id);
      if (!existingRisk) return;

      const restoredRisk: Risk = {
        ...existingRisk,
        isDeleted: false,
        deletedAt: undefined,
        lastModified: Date.now(),
      };

      setRisks((prev) => prev.map((r) => (r.id === id ? restoredRisk : r)));

      riskService
        .save(restoredRisk, `Risk restored: ${id}`)
        .catch((err) => console.error('Failed to restore risk:', err));
    },
    [risks, setRisks]
  );

  const handlePermanentDeleteRisk = useCallback(
    (id: string) => {
      setRisks((prev) => prev.filter((r) => r.id !== id));

      riskService
        .delete(id, `Risk permanently deleted: ${id}`)
        .catch((err) => console.error('Failed to permanently delete risk:', err));
    },
    [setRisks]
  );

  const handleEdit = useCallback(
    (risk: Risk) => {
      if (!currentUser) {
        showToast(
          'Please select a user before editing artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return;
      }
      setEditingRisk(risk);
      setIsRiskModalOpen(true);
    },
    [currentUser, setEditingRisk, setIsRiskModalOpen, showToast]
  );

  const value: RisksContextValue = {
    risks,
    setRisks,
    handleAddRisk,
    handleUpdateRisk,
    handleDeleteRisk,
    handleRestoreRisk,
    handlePermanentDeleteRisk,
    handleEdit,
  };

  return <RisksContext.Provider value={value}>{children}</RisksContext.Provider>;
};

export const useRisks = (): RisksContextValue => {
  const context = useContext(RisksContext);
  if (context === undefined) {
    throw new Error('useRisks must be used within a RisksProvider');
  }
  return context;
};
