/**
 * LinksPage
 *
 * Page wrapper for LinksView component
 */

import { LinksView } from '../components/LinksView';
import { useOpenArtifact } from '../hooks/useOpenArtifact';

export function LinksPage() {
  const openArtifact = useOpenArtifact();
  return <LinksView onNavigateToArtifact={openArtifact} />;
}
