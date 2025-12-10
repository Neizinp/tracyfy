import React from 'react';
import { TraceabilityMatrix } from '../components';
import {
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useUI,
} from '../app/providers';

export const TraceabilityMatrixPage: React.FC = () => {
  const { requirements } = useRequirements();
  const { useCases } = useUseCases();
  const { testCases } = useTestCases();
  const { information } = useInformation();
  const { searchQuery } = useUI();

  const query = searchQuery.toLowerCase();

  const filteredRequirements = requirements.filter((req) => {
    if (req.isDeleted) return false;
    if (!searchQuery) return true;
    return (
      req.id.toLowerCase().includes(query) ||
      req.title.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query) ||
      req.text.toLowerCase().includes(query)
    );
  });

  const filteredUseCases = useCases.filter((uc) => {
    if (uc.isDeleted) return false;
    if (!searchQuery) return true;
    return (
      uc.id.toLowerCase().includes(query) ||
      uc.title.toLowerCase().includes(query) ||
      uc.description.toLowerCase().includes(query)
    );
  });

  const filteredTestCases = testCases.filter((tc) => {
    if (tc.isDeleted) return false;
    if (!searchQuery) return true;
    return (
      tc.id.toLowerCase().includes(query) ||
      tc.title.toLowerCase().includes(query) ||
      tc.description.toLowerCase().includes(query)
    );
  });

  const filteredInformation = information.filter((info) => {
    if (info.isDeleted) return false;
    if (!searchQuery) return true;
    return (
      info.id.toLowerCase().includes(query) ||
      info.title.toLowerCase().includes(query) ||
      info.content.toLowerCase().includes(query)
    );
  });

  return (
    <TraceabilityMatrix
      requirements={filteredRequirements}
      useCases={filteredUseCases}
      testCases={filteredTestCases}
      information={filteredInformation}
    />
  );
};
