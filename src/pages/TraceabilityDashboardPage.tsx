import React, { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TraceabilityDashboard } from '../components';
import {
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useUI,
} from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';

type TabType = 'overview' | 'gaps' | 'links' | 'impact' | 'matrix' | 'graph';

export const TraceabilityDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const initialTab: TabType =
    tabParam && ['overview', 'gaps', 'links', 'impact', 'matrix', 'graph'].includes(tabParam)
      ? tabParam
      : 'overview';

  const { requirements, handleUpdateRequirement } = useRequirements();
  const { useCases, handleUpdateUseCase } = useUseCases();
  const { testCases, handleUpdateTestCase } = useTestCases();
  const { information, handleUpdateInformation } = useInformation();
  const { searchQuery, setLinkSourceId, setLinkSourceType, setIsLinkModalOpen } = useUI();
  const { allLinks: standaloneLinks, deleteLink } = useLinkService({});

  const filteredRequirements = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return requirements.filter((req) => {
      if (req.isDeleted) return false;
      if (!searchQuery) return true;
      return (
        req.id.toLowerCase().includes(query) ||
        req.title.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query) ||
        req.text.toLowerCase().includes(query)
      );
    });
  }, [requirements, searchQuery]);

  const filteredUseCases = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return useCases.filter((uc) => {
      if (uc.isDeleted) return false;
      if (!searchQuery) return true;
      return (
        uc.id.toLowerCase().includes(query) ||
        uc.title.toLowerCase().includes(query) ||
        uc.description.toLowerCase().includes(query)
      );
    });
  }, [useCases, searchQuery]);

  const filteredTestCases = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return testCases.filter((tc) => {
      if (tc.isDeleted) return false;
      if (!searchQuery) return true;
      return (
        tc.id.toLowerCase().includes(query) ||
        tc.title.toLowerCase().includes(query) ||
        tc.description.toLowerCase().includes(query)
      );
    });
  }, [testCases, searchQuery]);

  const filteredInformation = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return information.filter((info) => {
      if (info.isDeleted) return false;
      if (!searchQuery) return true;
      return (
        info.id.toLowerCase().includes(query) ||
        info.title.toLowerCase().includes(query) ||
        info.content.toLowerCase().includes(query)
      );
    });
  }, [information, searchQuery]);

  // Handler to open LinkModal for adding a link
  const handleAddLink = useCallback(
    (artifactId: string, artifactType: string) => {
      const typeMap: Record<string, 'requirement' | 'usecase' | 'testcase' | 'information'> = {
        requirement: 'requirement',
        useCase: 'usecase',
        testCase: 'testcase',
        information: 'information',
      };
      setLinkSourceId(artifactId);
      setLinkSourceType(typeMap[artifactType] || 'requirement');
      setIsLinkModalOpen(true);
    },
    [setLinkSourceId, setLinkSourceType, setIsLinkModalOpen]
  );

  // Handler to remove an orphan link
  const handleRemoveLink = useCallback(
    (artifactId: string, targetId: string) => {
      // Find the artifact and remove the orphan link
      const req = requirements.find((r) => r.id === artifactId);
      if (req) {
        const updatedLinks = (req.linkedArtifacts || []).filter((l) => l.targetId !== targetId);
        handleUpdateRequirement(artifactId, { linkedArtifacts: updatedLinks });
        return;
      }

      const uc = useCases.find((u) => u.id === artifactId);
      if (uc) {
        const updatedLinks = (uc.linkedArtifacts || []).filter((l) => l.targetId !== targetId);
        handleUpdateUseCase(artifactId, { linkedArtifacts: updatedLinks });
        return;
      }

      const tc = testCases.find((t) => t.id === artifactId);
      if (tc) {
        const updatedLinks = (tc.linkedArtifacts || []).filter((l) => l.targetId !== targetId);
        handleUpdateTestCase(artifactId, { linkedArtifacts: updatedLinks });
        return;
      }

      const info = information.find((i) => i.id === artifactId);
      if (info) {
        const updatedLinks = (info.linkedArtifacts || []).filter((l) => l.targetId !== targetId);
        handleUpdateInformation(artifactId, { linkedArtifacts: updatedLinks });
      }
    },
    [
      requirements,
      useCases,
      testCases,
      information,
      handleUpdateRequirement,
      handleUpdateUseCase,
      handleUpdateTestCase,
      handleUpdateInformation,
    ]
  );

  // Handler to delete a standalone link
  const handleDeleteLink = useCallback(
    async (linkId: string) => {
      try {
        await deleteLink(linkId);
      } catch (error) {
        console.error('Failed to delete link:', error);
      }
    },
    [deleteLink]
  );

  return (
    <TraceabilityDashboard
      key={initialTab}
      requirements={filteredRequirements}
      useCases={filteredUseCases}
      testCases={filteredTestCases}
      information={filteredInformation}
      standaloneLinks={standaloneLinks}
      initialTab={initialTab}
      onAddLink={handleAddLink}
      onRemoveLink={handleRemoveLink}
      onDeleteLink={handleDeleteLink}
    />
  );
};
