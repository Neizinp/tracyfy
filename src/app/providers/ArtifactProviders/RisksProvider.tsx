import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import { riskService } from '../../../services/artifactServices';
import { useFileSystem } from '../FileSystemProvider';
import { useToast } from '../ToastProvider';
import { useGlobalState } from '../GlobalStateProvider';
import type { Risk, CommitInfo } from '../../../types';
import { realGitService } from '../../../services/realGitService';
import { createArtifactProvider } from './BaseArtifactProvider';

interface RisksContextValue {
  risks: Risk[];
  loading: boolean;
  refreshRisks: () => Promise<void>;
  getRiskHistory: (id: string) => Promise<CommitInfo[]>;
  handleAddRisk: (risk: Omit<Risk, 'id' | 'lastModified' | 'revision'>) => Promise<Risk | null>;
  handleUpdateRisk: (id: string, data: Partial<Risk>) => Promise<void>;
  handleDeleteRisk: (id: string) => void;
  handleRestoreRisk: (id: string) => void;
  handlePermanentDeleteRisk: (id: string) => void;
  handleEdit: (risk: Risk) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<Risk>({
  type: 'risks',
  displayName: 'Risks',
  useData: (state) => ({
    items: state.risks,
    setItems: state.setRisks,
  }),
  useFS: (fs) => ({
    save: fs.saveRisk,
    delete: fs.deleteRisk,
    fsItems: fs.risks,
    isReady: fs.isReady,
  }),
  useUIHelpers: (ui) => ({
    setEditingItem: ui.setEditingRisk,
    setIsModalOpen: ui.setIsRiskModalOpen,
  }),
});

export const RisksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseProvider>{children}</BaseProvider>;
};

export const useRisks = (): RisksContextValue => {
  const context = useProviderContext();
  const { setRisks } = useGlobalState();
  const { isReady } = useFileSystem();
  const { showToast } = useToast();
  const [loading, setLoading] = React.useState(false);

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

  const getRiskHistory = useCallback(
    async (id: string) => {
      if (!isReady || !realGitService.isInitialized()) return [];
      return await realGitService.getHistory(`risks/${id}.md`);
    },
    [isReady]
  );

  return {
    risks: context.items,
    loading,
    refreshRisks,
    getRiskHistory,
    handleAddRisk: context.handleAdd,
    handleUpdateRisk: context.handleUpdate,
    handleDeleteRisk: context.handleDelete,
    handleRestoreRisk: context.handleRestore,
    handlePermanentDeleteRisk: context.handlePermanentDelete,
    handleEdit: context.handleEdit,
  };
};
