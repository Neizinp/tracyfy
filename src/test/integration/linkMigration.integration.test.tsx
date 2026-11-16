/**
 * Projects created by older versions stored links inside each artifact
 * (linkedArtifacts). On load they are migrated to link files - the only link
 * model the app uses - and committed, so nothing is lost or left dirty.
 */
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import git from 'isomorphic-git';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import { requirementToMarkdown } from '../../utils/markdownUtils';

describe('integration: legacy embedded links', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('are migrated to committed link files on load and shown as links', async () => {
    h = await startApp();
    const projectId = h.app().project.currentProjectId;

    // What an older version left on disk: REQ-001 embeds a link to REQ-002
    const write = (id: string, title: string, linkedArtifacts = [] as never[]) =>
      fs.writeFileSync(
        path.join(h.dir, 'requirements', `${id}.md`),
        requirementToMarkdown({
          id,
          title,
          text: '',
          revision: '01',
          dateCreated: 1,
          lastModified: 1,
          linkedArtifacts,
        })
      );
    fs.mkdirSync(path.join(h.dir, 'requirements'), { recursive: true });
    write('REQ-001', 'Login', [{ targetId: 'REQ-002', type: 'satisfies' }] as never[]);
    write('REQ-002', 'Logout');
    const projectFile = path.join(h.dir, 'projects', `${projectId}.md`);
    fs.writeFileSync(
      projectFile,
      fs
        .readFileSync(projectFile, 'utf8')
        .replace(/requirementIds: \[\]/, 'requirementIds:\n  - "REQ-001"\n  - "REQ-002"')
    );
    await git.add({ fs, dir: h.dir, filepath: '.' });
    await git.commit({
      fs,
      dir: h.dir,
      message: 'legacy data',
      author: { name: 'a', email: 'a@a' },
    });

    await h.restart();

    // A link file exists and the app knows the link
    expect(h.app().fileSystem.links).toEqual([
      expect.objectContaining({ sourceId: 'REQ-001', targetId: 'REQ-002', type: 'satisfies' }),
    ]);
    // The artifact no longer embeds it (one link model)
    expect(h.readFile('requirements/REQ-001.md')).not.toContain('REQ-002');
    // Everything is committed
    expect(await h.dirtyPaths()).toEqual([]);

    // Shown in the requirement's Relationships tab
    const req = h.app().globalState.globalRequirements.find((r) => r.id === 'REQ-001')!;
    await act(async () => h.app().requirements.handleEdit(req));
    fireEvent.click(await screen.findByRole('button', { name: 'Relationships' }));
    expect(within(await screen.findByRole('dialog')).getByText('REQ-002')).toBeInTheDocument();

    // Running again (next startup) changes nothing
    const commits = (await h.commitMessages()).length;
    await h.restart();
    expect((await h.commitMessages()).length).toBe(commits);
    expect(h.app().fileSystem.links).toHaveLength(1);
  }, 90_000);
});
