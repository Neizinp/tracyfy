/**
 * useLinkService Hook
 *
 * React hook for managing links using the diskLinkService.
 * Provides loading state, caching, and easy access to link operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { diskLinkService, type IncomingLink } from '../services/diskLinkService';
import type { Link } from '../types';
import type { LinkType } from '../utils/linkTypes';

interface UseLinkServiceReturn {
  // Data
  outgoingLinks: Link[];
  incomingLinks: IncomingLink[];
  allLinks: Link[];
  loading: boolean;
  error: string | null;

  // Operations
  createLink: (
    sourceId: string,
    targetId: string,
    type: LinkType,
    projectIds?: string[]
  ) => Promise<Link>;
  deleteLink: (linkId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface UseLinkServiceOptions {
  artifactId?: string;
  projectId?: string; // Filter links by project visibility
}

/**
 * Hook for managing links for a specific artifact
 * @param options.artifactId - Optional artifact ID to get links for
 * @param options.projectId - Optional project ID to filter links by project visibility
 */
export function useLinkService(options: UseLinkServiceOptions = {}): UseLinkServiceReturn {
  const { artifactId, projectId } = options;
  const [outgoingLinks, setOutgoingLinks] = useState<Link[]>([]);
  const [incomingLinks, setIncomingLinks] = useState<IncomingLink[]>([]);
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load links for the artifact
  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all links (filtered by project if provided)
      const all = projectId
        ? await diskLinkService.getLinksForProject(projectId)
        : await diskLinkService.getAllLinks();
      setAllLinks(all);

      // Only load artifact-specific links if artifactId is provided
      if (artifactId) {
        const [outgoing, incoming] = await Promise.all([
          projectId
            ? diskLinkService.getOutgoingLinksForProject(artifactId, projectId)
            : diskLinkService.getOutgoingLinks(artifactId),
          projectId
            ? diskLinkService.getIncomingLinksForProject(artifactId, projectId)
            : diskLinkService.getIncomingLinks(artifactId),
        ]);
        setOutgoingLinks(outgoing);
        setIncomingLinks(incoming);
      } else {
        setOutgoingLinks([]);
        setIncomingLinks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links');
      console.error('Failed to load links:', err);
    } finally {
      setLoading(false);
    }
  }, [artifactId, projectId]);

  // Load on mount and when artifactId/projectId changes
  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Create a new link
  const createLink = useCallback(
    async (
      sourceId: string,
      targetId: string,
      type: LinkType,
      projectIds: string[] = []
    ): Promise<Link> => {
      try {
        const link = await diskLinkService.createLink(sourceId, targetId, type, projectIds);
        // Refresh to get updated lists
        await loadLinks();
        return link;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create link');
        throw err;
      }
    },
    [loadLinks]
  );

  // Delete a link
  const deleteLink = useCallback(
    async (linkId: string): Promise<void> => {
      try {
        await diskLinkService.deleteLink(linkId);
        // Refresh to get updated lists
        await loadLinks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete link');
        throw err;
      }
    },
    [loadLinks]
  );

  return {
    outgoingLinks,
    incomingLinks,
    allLinks,
    loading,
    error,
    createLink,
    deleteLink,
    refresh: loadLinks,
  };
}
