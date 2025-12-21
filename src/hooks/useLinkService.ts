/**
 * useLinkService Hook
 *
 * React hook for managing links using the diskLinkService.
 * Provides loading state, caching, and easy access to link operations.
 * Now leverages the centralized LinksProvider for state management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { diskLinkService, type IncomingLink } from '../services/diskLinkService';
import type { Link } from '../types';
import type { LinkType } from '../utils/linkTypes';
import { debug } from '../utils/debug';
import { useFileSystem } from '../app/providers/FileSystemProvider';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get centralized links from FileSystemProvider
  const { isReady, links: allLinksFromProvider } = useFileSystem();

  // Derive allLinks from provider state, filtering by project if needed
  const allLinks = useMemo(() => {
    if (!allLinksFromProvider) return [];
    if (!projectId) return allLinksFromProvider;
    return allLinksFromProvider.filter(
      (link) => link.projectIds.length === 0 || link.projectIds.includes(projectId)
    );
  }, [allLinksFromProvider, projectId]);

  // Derive outgoing and incoming links from allLinks
  const outgoingLinks = useMemo(() => {
    if (!artifactId) return [];
    return allLinks.filter((link) => link.sourceId === artifactId);
  }, [allLinks, artifactId]);

  const incomingLinks = useMemo((): IncomingLink[] => {
    if (!artifactId) return [];
    return allLinks
      .filter((link) => link.targetId === artifactId)
      .map((link) => ({
        linkId: link.id,
        sourceId: link.sourceId,
        sourceType: link.sourceId.split('-')[0],
        linkType: link.type,
      }));
  }, [allLinks, artifactId]);

  // Load links is now a no-op as we rely on provider state,
  // but we keep it for API compatibility
  const loadLinks = useCallback(async () => {
    debug.log('[useLinkService] loadLinks called, now relies on provider state');
    setLoading(false);
  }, []);

  // Load on mount and when isReady changes
  useEffect(() => {
    if (isReady) {
      setLoading(false);
    }

    // Subscribe to diskLinkService changes for real-time updates (still needed for write operations)
    const unsubscribe = diskLinkService.subscribe(() => {
      debug.log('[useLinkService] Service change detected');
    });

    return () => unsubscribe();
  }, [isReady]);

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
