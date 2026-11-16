import React, { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TraceabilityDashboard } from '../components';
import {
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useUI,
  useRisks,
  useDocuments,
} from '../app/providers';
import { useLinkService } from '../hooks/useLinkService';
import { notifyError } from '../app/providers/ToastProvider';
import { isKindId } from '../domain/artifactKinds';

type TabType = 'overview' | 'gaps' | 'links' | 'impact' | 'matrix' | 'graph';

export const TraceabilityDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const initialTab: TabType =
    tabParam && ['overview', 'gaps', 'links', 'impact', 'matrix', 'graph'].includes(tabParam)
      ? tabParam
      : 'overview';

  const { requirements } = useRequirements();
  const { useCases } = useUseCases();
  const { testCases } = useTestCases();
  const { information } = useInformation();
  const { risks } = useRisks();
  const { documents } = useDocuments();
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
        req.description?.toLowerCase().includes(query) ||
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
        (info.content || info.text || '').toLowerCase().includes(query)
      );
    });
  }, [information, searchQuery]);

  const filteredRisks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return risks.filter((risk) => {
      if (risk.isDeleted) return false;
      if (!searchQuery) return true;
      return (
        risk.id.toLowerCase().includes(query) ||
        risk.title.toLowerCase().includes(query) ||
        (risk.description || '').toLowerCase().includes(query)
      );
    });
  }, [risks, searchQuery]);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return documents.filter((doc) => {
      if (doc.isDeleted) return false;
      if (!searchQuery) return true;
      return doc.id.toLowerCase().includes(query) || doc.title.toLowerCase().includes(query);
    });
  }, [documents, searchQuery]);

  // Handler to open LinkModal for adding a link
  const handleAddLink = useCallback(
    (artifactId: string, artifactType: string) => {
      setLinkSourceId(artifactId);
      setLinkSourceType(isKindId(artifactType) ? artifactType : 'requirement');
      setIsLinkModalOpen(true);
    },
    [setLinkSourceId, setLinkSourceType, setIsLinkModalOpen]
  );

  // Handler to remove an orphan link
  const handleRemoveLink = useCallback(
    (artifactId: string, targetId: string) => {
      standaloneLinks
        .filter((l) => l.sourceId === artifactId && l.targetId === targetId)
        .forEach((l) => {
          deleteLink(l.id).catch((err) => notifyError('Could not remove link', err));
        });
    },
    [standaloneLinks, deleteLink]
  );

  return (
    <TraceabilityDashboard
      key={initialTab}
      requirements={filteredRequirements}
      useCases={filteredUseCases}
      testCases={filteredTestCases}
      information={filteredInformation}
      risks={filteredRisks}
      documents={filteredDocuments}
      standaloneLinks={standaloneLinks}
      initialTab={initialTab}
      onAddLink={handleAddLink}
      onRemoveLink={handleRemoveLink}
    />
  );
};
