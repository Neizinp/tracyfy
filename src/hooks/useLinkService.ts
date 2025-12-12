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
  createLink: (sourceId: string, targetId: string, type: LinkType) => Promise<Link>;
  deleteLink: (linkId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing links for a specific artifact
 */
export function useLinkService(artifactId?: string): UseLinkServiceReturn {
  const [outgoingLinks, setOutgoingLinks] = useState<Link[]>([]);
  const [incomingLinks, setIncomingLinks] = useState<IncomingLink[]>([]);
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load links for the artifact
  const loadLinks = useCallback(async () => {
    if (!artifactId) {
      setOutgoingLinks([]);
      setIncomingLinks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [outgoing, incoming, all] = await Promise.all([
        diskLinkService.getOutgoingLinks(artifactId),
        diskLinkService.getIncomingLinks(artifactId),
        diskLinkService.getAllLinks(),
      ]);

      setOutgoingLinks(outgoing);
      setIncomingLinks(incoming);
      setAllLinks(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links');
      console.error('Failed to load links:', err);
    } finally {
      setLoading(false);
    }
  }, [artifactId]);

  // Load on mount and when artifactId changes
  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Create a new link
  const createLink = useCallback(
    async (sourceId: string, targetId: string, type: LinkType): Promise<Link> => {
      try {
        const link = await diskLinkService.createLink(sourceId, targetId, type);
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
