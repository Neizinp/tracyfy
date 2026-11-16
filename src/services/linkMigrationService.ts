/**
 * One-time migration of legacy embedded links.
 *
 * Older versions stored links inside each artifact (`linkedArtifacts`). The
 * app now uses link files (links/LINK-xxx.md) only. On load, every embedded
 * link that has no matching link file is turned into one (global scope, as
 * embedded links were), and the embedded list is cleared. All writes are
 * committed. Running it again is a no-op.
 */
import type { ArtifactLink, Link } from '../types';
import type { LinkType } from '../utils/linkTypes';
import { diskLinkService } from './diskLinkService';
import {
  requirementService,
  useCaseService,
  testCaseService,
  informationService,
  riskService,
  documentService,
} from './artifactServices';
import { isValidArtifactId } from '../utils/importUtils';

type WithEmbeddedLinks = { id: string; linkedArtifacts?: ArtifactLink[] };

const SERVICES_WITH_EMBEDDED_LINKS = [
  requirementService,
  useCaseService,
  testCaseService,
  informationService,
  riskService,
  documentService,
];

export async function migrateEmbeddedLinks(): Promise<{
  linksCreated: number;
  artifactsUpdated: number;
}> {
  const key = (s: string, t: string, type: string) => `${s}|${t}|${type}`;
  const existing: Link[] = await diskLinkService.loadAll(true);
  const known = new Set(existing.map((l) => key(l.sourceId, l.targetId, l.type)));

  let linksCreated = 0;
  let artifactsUpdated = 0;

  for (const service of SERVICES_WITH_EMBEDDED_LINKS) {
    const items = (await service.loadAll(true)) as WithEmbeddedLinks[];
    for (const item of items) {
      const embedded = item.linkedArtifacts ?? [];
      if (embedded.length === 0) continue;

      for (const link of embedded) {
        if (!isValidArtifactId(link?.targetId) || typeof link.type !== 'string') continue;
        const k = key(item.id, link.targetId, link.type);
        if (known.has(k)) continue;
        await diskLinkService.createLink(item.id, link.targetId, link.type as LinkType, []);
        known.add(k);
        linksCreated++;
      }

      await (service as { save: (x: unknown, msg?: string) => Promise<unknown> }).save(
        { ...item, linkedArtifacts: [] },
        `Move embedded links of ${item.id} to link files`
      );
      artifactsUpdated++;
    }
  }

  return { linksCreated, artifactsUpdated };
}
