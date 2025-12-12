import React, { useMemo } from 'react';
import { TraceabilityDashboard } from '../components';
import {
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useUI,
} from '../app/providers';

export const TraceabilityDashboardPage: React.FC = () => {
  const { requirements } = useRequirements();
  const { useCases } = useUseCases();
  const { testCases } = useTestCases();
  const { information } = useInformation();
  const { searchQuery } = useUI();

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

  return (
    <TraceabilityDashboard
      requirements={filteredRequirements}
      useCases={filteredUseCases}
      testCases={filteredTestCases}
      information={filteredInformation}
    />
  );
};
