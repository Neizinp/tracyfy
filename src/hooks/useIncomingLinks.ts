import { useMemo } from 'react';
import type { ArtifactLink } from '../types';

interface IncomingLink {
  sourceId: string;
  sourceType: 'requirement' | 'usecase' | 'testcase' | 'information';
  linkType: ArtifactLink['type'];
}

interface UseIncomingLinksProps {
  targetId: string;
  requirements: { id: string; linkedArtifacts?: ArtifactLink[] }[];
  useCases: { id: string; linkedArtifacts?: ArtifactLink[] }[];
  testCases: { id: string; linkedArtifacts?: ArtifactLink[] }[];
  information: { id: string; linkedArtifacts?: ArtifactLink[] }[];
}

/**
 * Hook to compute incoming links for a given artifact.
 * Scans all artifacts to find those that have a link pointing to the target.
 */
export function useIncomingLinks({
  targetId,
  requirements,
  useCases,
  testCases,
  information,
}: UseIncomingLinksProps): IncomingLink[] {
  return useMemo(() => {
    const incomingLinks: IncomingLink[] = [];

    // Scan requirements
    requirements.forEach((req) => {
      (req.linkedArtifacts || []).forEach((link) => {
        if (link.targetId === targetId) {
          incomingLinks.push({
            sourceId: req.id,
            sourceType: 'requirement',
            linkType: link.type,
          });
        }
      });
    });

    // Scan use cases
    useCases.forEach((uc) => {
      (uc.linkedArtifacts || []).forEach((link) => {
        if (link.targetId === targetId) {
          incomingLinks.push({
            sourceId: uc.id,
            sourceType: 'usecase',
            linkType: link.type,
          });
        }
      });
    });

    // Scan test cases
    testCases.forEach((tc) => {
      (tc.linkedArtifacts || []).forEach((link) => {
        if (link.targetId === targetId) {
          incomingLinks.push({
            sourceId: tc.id,
            sourceType: 'testcase',
            linkType: link.type,
          });
        }
      });
    });

    // Scan information
    information.forEach((info) => {
      (info.linkedArtifacts || []).forEach((link) => {
        if (link.targetId === targetId) {
          incomingLinks.push({
            sourceId: info.id,
            sourceType: 'information',
            linkType: link.type,
          });
        }
      });
    });

    return incomingLinks;
  }, [targetId, requirements, useCases, testCases, information]);
}
