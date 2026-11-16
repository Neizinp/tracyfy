/**
 * Loading the demo project through the sidebar button: every demo link must
 * connect two artifacts that exist, of the kinds the demo data says.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import { DEMO_ARTIFACTS } from '../../utils/demoData';
import { kindOfId } from '../../domain/artifactKinds';

describe('integration: demo data', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('creates every demo link between existing artifacts of the right kinds', async () => {
    h = await startApp();

    const button = await screen.findByRole('button', { name: 'Load demo data' });
    fireEvent.click(button); // first click asks for confirmation
    fireEvent.click(button);
    expect(
      await screen.findByText('Demo data loaded', {}, { timeout: 30_000 })
    ).toBeInTheDocument();

    const g = h.app().globalState;
    const existing = new Set(
      [...g.requirements, ...g.useCases, ...g.testCases, ...g.information, ...g.risks].map(
        (a) => a.id
      )
    );
    await waitFor(() => expect(h.app().fileSystem.links).toHaveLength(DEMO_ARTIFACTS.links.length));

    const links = h.app().fileSystem.links;
    const kinds = links.map((l) => [kindOfId(l.sourceId), kindOfId(l.targetId)]);
    expect(kinds).toEqual(DEMO_ARTIFACTS.links.map((d) => [d.sourceType, d.targetType]));
    for (const link of links) {
      expect(existing.has(link.sourceId), link.sourceId).toBe(true);
      expect(existing.has(link.targetId), link.targetId).toBe(true);
    }
  }, 90_000);
});
