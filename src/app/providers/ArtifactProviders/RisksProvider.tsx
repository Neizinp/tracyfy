import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { riskService } from '../../../services/artifactServices';
import { useFileSystem } from '../FileSystemProvider';
import { useToast } from '../ToastProvider';
import { useUI } from '../UIProvider';
import { useUser } from '../UserProvider';
import { useGlobalState } from '../GlobalStateProvider';
import { debug } from '../../../utils/debug';
import type { Risk, CommitInfo } from '../../../types';
import { realGitService } from '../../../services/realGitService';
import { useArtifactCRUD } from './useArtifactCRUD';

interface RisksContextValue {
  risks: Risk[];
  loading: boolean;
  refreshRisks: () => Promise<void>;
  getRiskHistory: (id: string) => Promise<CommitInfo[]>;

  // UI helpers
  handleAddRisk: (risk: Omit<Risk, 'id' | 'lastModified' | 'revision'>) => Promise<Risk | null>;
  handleUpdateRisk: (id: string, data: Partial<Risk>) => Promise<void>;
  handleDeleteRisk: (id: string) => void;
  handleRestoreRisk: (id: string) => void;
  handlePermanentDeleteRisk: (id: string) => void;
  handleEdit: (risk: Risk) => void;
}

const RisksContext = createContext<RisksContextValue | undefined>(undefined);

export const RisksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { risks, setRisks } = useGlobalState();
  const [loading, setLoading] = React.useState(false);
  const {
    saveRisk: fsSaveRisk,
    deleteRisk: fsDeleteRisk,
    risks: fsRisks,
    isReady,
  } = useFileSystem();
  const { showToast } = useToast();
  const { setEditingRisk, setIsRiskModalOpen } = useUI();
  const { currentUser } = useUser();
  const hasSyncedInitial = useRef(false);

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
  }, [isReady, isE2E, setRisks, showToast]);

  // Sync risks from filesystem on initial load
  useEffect(() => {
    if (isReady && fsRisks.length > 0 && !hasSyncedInitial.current) {
      debug.log('[RisksProvider] Syncing from filesystem:', fsRisks.length, 'risks');
      setRisks(fsRisks);
      hasSyncedInitial.current = true;
    }
  }, [isReady, fsRisks, setRisks]);

  const {
    handleAdd: handleAddRisk,
    handleUpdate: handleUpdateRisk,
    handleDelete: handleDeleteRisk,
    handleRestore: handleRestoreRisk,
    handlePermanentDelete: handlePermanentDeleteRisk,
  } = useArtifactCRUD<Risk>({
    type: 'risks',
    items: risks,
    setItems: setRisks,
    saveFn: fsSaveRisk,
    deleteFn: fsDeleteRisk,
    onAfterUpdate: () => {
      setIsRiskModalOpen(false);
      setEditingRisk(null);
    },
  });

  const getRiskHistory = useCallback(
    async (id: string) => {
      if (!isReady || !realGitService.isInitialized()) return [];
      return await realGitService.getHistory(`risks/${id}.md`);
    },
    [isReady]
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
    loading,
    refreshRisks,
    getRiskHistory,
    handleAddRisk,
    handleUpdateRisk,
    handleDeleteRisk,
    handleRestoreRisk,
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
