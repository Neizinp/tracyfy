/**
 * useLinkService Hook
 *
 * React hook for reading/managing links. Links come from the store, and
 * writes go through the store's actions so all views update immediately.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { IncomingLink } from '../services/diskLinkService';
import type { Link } from '../types';
import type { LinkType } from '../domain/linkTypes';
import { debug } from '../utils/debug';
import { useAppStore } from '../state';

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

interface UseLinkServiceOptions {
  artifactId?: string;
}

/**
 * Hook for managing links for a specific artifact
 * @param options.artifactId - Optional artifact ID to get links for
 */
export function useLinkService(options: UseLinkServiceOptions = {}): UseLinkServiceReturn {
  const { artifactId } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Links and link actions from the store
  const isReady = useAppStore((s) => s.isReady);
  const allLinksFromProvider = useAppStore((s) => s.links);
  const createLinkInProvider = useAppStore((s) => s.createLink);
  const deleteLinkInProvider = useAppStore((s) => s.deleteLink);

  const allLinks = useMemo(() => allLinksFromProvider ?? [], [allLinksFromProvider]);

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
  }, [isReady]);

  // Create a new link
  const createLink = useCallback(
    async (sourceId: string, targetId: string, type: LinkType): Promise<Link> => {
      try {
        // Goes through the provider so link state (and every view) updates immediately
        return await createLinkInProvider(sourceId, targetId, type);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create link');
        throw err;
      }
    },
    [createLinkInProvider]
  );

  // Delete a link
  const deleteLink = useCallback(
    async (linkId: string): Promise<void> => {
      try {
        await deleteLinkInProvider(linkId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete link');
        throw err;
      }
    },
    [deleteLinkInProvider]
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
