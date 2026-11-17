import { kind } from '../../../domain/artifactKinds';
import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Risk, CommitInfo } from '../../../types';
import { realGitService } from '../../../services/realGitService';
import { createArtifactProvider } from './BaseArtifactProvider';
import { useAppStore } from '../../../state';

interface RisksContextValue {
  risks: Risk[];
  loading: boolean;
  refreshRisks: () => Promise<void>;
  getRiskHistory: (id: string) => Promise<CommitInfo[]>;
  handleAddRisk: (risk: Omit<Risk, 'id' | 'lastModified' | 'revision'>) => Promise<Risk | null>;
  handleUpdateRisk: (id: string, data: Partial<Risk>) => Promise<void>;
  handleDeleteRisk: (id: string) => void;
  handleRestoreRisk: (id: string) => void;
  handleEdit: (risk: Risk) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<Risk>({
  type: 'risk',
  displayName: 'Risks',
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
  const isReady = useAppStore((s) => s.isReady);
  const reloadData = useAppStore((s) => s.reload);
  const showToast = useAppStore((s) => s.showToast);
  const [loading, setLoading] = React.useState(false);

  // Check if we're in E2E test mode
  const isE2E =
    typeof window !== 'undefined' &&
    (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;

  const refreshRisks = useCallback(async () => {
    if (!isReady && !isE2E) return;

    setLoading(true);
    try {
      // Reload through FileSystemProvider (the single source of truth)
      await reloadData();
    } catch (error) {
      console.error('Failed to load risks:', error);
      showToast('Failed to load risks', 'error');
    } finally {
      setLoading(false);
    }
  }, [isReady, isE2E, reloadData, showToast]);

  const getRiskHistory = useCallback(
    async (id: string) => {
      if (!isReady || !realGitService.isInitialized()) return [];
      return await realGitService.getHistory(`${kind('risk').folder}/${id}.md`);
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
    handleEdit: context.handleEdit,
  };
};
