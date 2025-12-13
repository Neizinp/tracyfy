/**
 * LinksPage
 *
 * Page wrapper for LinksView component
 */

import { LinksView } from '../components/LinksView';
import { useUI } from '../app/providers';

export function LinksPage() {
  const {
    setEditingUseCase,
    setIsUseCaseModalOpen,
    setSelectedTestCaseId,
    setIsEditTestCaseModalOpen,
    setSelectedInformation,
    setIsInformationModalOpen,
  } = useUI();

  // Navigate to an artifact's modal
  const handleNavigateToArtifact = (id: string, type: string) => {
    switch (type) {
      case 'requirement':
        // Would need to find the requirement object - for now just log
        console.log(`Navigate to requirement: ${id}`);
        break;
      case 'usecase':
        setEditingUseCase(null); // Would need the actual use case
        setIsUseCaseModalOpen(true);
        break;
      case 'testcase':
        setSelectedTestCaseId(id);
        setIsEditTestCaseModalOpen(true);
        break;
      case 'information':
        setSelectedInformation(null); // Would need the actual info
        setIsInformationModalOpen(true);
        break;
    }
  };

  return <LinksView onNavigateToArtifact={handleNavigateToArtifact} />;
}
