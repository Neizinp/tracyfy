# Tracyfy target design

Status: steps 1–7 of §7 are done; the rest is the plan.

This document describes where the codebase should end up, the decisions behind it, and
the order in which to get there. The goal is a codebase where a change that concerns
"all artifacts" is made in one place, and where the tool supports requirements
engineering practice (ISO/IEC/IEEE 29148, INCOSE) rather than just storing text.

## 1. Decisions

### Taken

| #   | Decision                                       | Consequence                                                                                                                           |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **One project per folder (git repository).**   | No project entity, no project switching, no `requirementIds`/`useCaseIds`/... lists. Everything in the folder belongs to the project. |
| D2  | **No global library / cross-project sharing.** | Reuse means copying a folder. Removes `projectIds` on links, "global vs project" link scope, the library page and modals.             |
| D3  | **Custom attributes stay.**                    | User-defined fields are a first-class part of the model (see §3.2).                                                                   |
| D4  | **No backward compatibility.**                 | The file format can be redesigned freely. Legacy migrations (`linkMigrationService`, legacy project files) are deleted, not ported.   |

### Proposed (need your confirmation)

| #   | Proposal                                                                                                                                                                                            | Why                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Fixed set of artifact kinds** (requirement, use case, test case, information, risk, document) **+ custom attributes**. Users cannot define new kinds.                                             | Covers almost all needs with a fraction of the complexity of a fully configurable meta-model. The registry (§3.1) makes adding a kind in code cheap, so this can be revisited.                                                   |
| P2  | **Traceability rules are data in the project config**, with a sensible default rule set.                                                                                                            | Coverage becomes "every requirement is verified by ≥1 test case", not "has any link". Strictness is a per-project choice, so the same tool serves agile and regulated teams.                                                     |
| P3  | **Suspect links via fingerprints.** Each link stores a fingerprint of the target's content when the link was last reviewed. If the target changes, the link is suspect until someone re-reviews it. | Core RE feature that keeps traceability honest. Stateless and git-friendly: no background job, merges cleanly. (Same approach as Doorstop.)                                                                                      |
| P4  | **IDs come from file names; no counters folder.** The next ID is `max(existing) + 1` for that kind. Deleted artifacts keep their file (status `deleted`), so IDs are never reused.                  | Removes the counters folder, its auto-commit special case and its merge conflicts. Two people creating `REQ-013` on different branches becomes an ordinary git add/add conflict, which the app can detect and offer to renumber. |
| P5  | **The git author is the user.** No separate user management.                                                                                                                                        | One identity, already recorded on every commit. Removes the users store and the "current user" file.                                                                                                                             |
| P6  | **Workflows are replaced by a lifecycle** (§3.4): review and approval are status transitions, recorded in git.                                                                                      | Today workflows are a parallel artifact that is not connected to status or baselines.                                                                                                                                            |
| P7  | **Keep both Electron and the browser (File System Access API).**                                                                                                                                    | Already unified in `shared/gitOps.js`; cost is low.                                                                                                                                                                              |

## 2. Problems this design removes

Observed in the current code:

- Every kind is hand-coded through every layer: modal, form hook, list, page, provider,
  disk service, markdown functions, PDF renderer and Excel sheet. That is ~10 files per kind, and
  features silently miss kinds that were added later (risks, documents).
- Four vocabularies for the same thing: `'requirements'`, `'usecase'`, `'useCase'`, `UC`.
- The same relation expressed three ways: `TestCase.requirementIds`, `Requirement.useCaseIds`,
  link files.
- `FileSystemProvider` (~1000 lines) mixes IO, git, migrations and React state; ~15 nested
  providers.
- Status values are free strings defined separately in each modal.
- ~1170 inline `style={{…}}` blocks.
- Many tests mock disk and git away, so they pass while the app is broken.

## 3. Domain model

All of this lives in `src/domain/` as plain TypeScript with no React or IO, so it can be
unit-tested directly.

### 3.1 Artifact kind registry

One definition per kind; everything else is derived from it.

```ts
interface ArtifactKind {
  id: 'requirement' | 'useCase' | 'testCase' | 'information' | 'risk' | 'document';
  prefix: string; // 'REQ'
  folder: string; // 'requirements'
  label: { singular: string; plural: string };
  fields: FieldDef[]; // built-in fields, in display order
  body?: FieldId; // which field is the markdown body of the file
  lifecycle: LifecycleId;
  icon: IconName;
  color: ColorToken;
}
```

There is exactly one kind identifier (`'useCase'`) and one prefix (`'UC'`). Folder names,
labels, colors and icons are all looked up from the registry.

### 3.2 Fields: built-in and custom are the same thing

```ts
interface FieldDef {
  id: string; // 'priority', or 'attr:component' for custom
  label: string;
  type: 'text' | 'markdown' | 'number' | 'date' | 'enum' | 'boolean' | 'user';
  options?: string[]; // enum
  required?: boolean;
  default?: unknown;
  searchable?: boolean;
  showInTable?: boolean;
}
```

Built-in fields come from the registry. Custom attributes are `FieldDef`s stored in the
project config and attached to one or more kinds. The form, table, detail view, search,
import/export, PDF and Excel all iterate over `fieldsFor(kind) = builtIn ∪ custom`.
A new field, built-in or custom, needs no UI code.

Kinds that need more than a field list get a dedicated editor component: the document
structure editor, and possibly use case flows. These are explicit overrides; everything else
goes through the generic views.

### 3.3 Links and the traceability information model

Links are the only way to express a relation. No artifact stores references to other
artifacts: there is no `TestCase.requirementIds`, `Requirement.useCaseIds` or embedded
`linkedArtifacts`. A test case file describes the test, and the fact that it verifies a
requirement is a link. Creating or removing a link never modifies either artifact.

Links live in `links/` as one file each:

```yaml
id: LINK-042
source: TC-007
type: verifies
target: REQ-012
reviewed: 3f9a1c2e # fingerprint of REQ-012 when this link was last reviewed (P3)
```

The project config declares which links are allowed and what counts as coverage:

```yaml
traceability:
  allowed: # source kind, link type, target kind
    - [testCase, verifies, requirement]
    - [requirement, refines, requirement]
    - [requirement, satisfies, useCase]
    - [requirement, mitigates, risk]
    - [requirement, derived_from, information]
    - ['*', related_to, '*']
  coverage:
    - name: Every requirement is verified
      kind: requirement
      needs: { incoming: verifies, from: testCase }
    - name: Every risk is mitigated
      kind: risk
      needs: { incoming: mitigates, from: requirement }
```

From this, derived and pure:

- **Link dialog** only offers link types that are valid for the chosen source and target.
- **Gap analysis** reports rule violations by rule name ("REQ-012 is not verified").
  Today it only reports "no outgoing links".
- **Suspect links**: a link is suspect when `fingerprint(target) !== link.reviewed`. The
  fingerprint is a hash of the target's normalized content fields (not metadata). Suspect
  links show in the gap view, on the artifact and in the pending-changes panel, with a
  "Mark reviewed" action.
- The parent/child hierarchy is a link type (`refines`), not a separate mechanism.

### 3.4 Lifecycle

Statuses and transitions are defined per lifecycle, not as strings per modal:

```yaml
lifecycles:
  requirement:
    states: [draft, in_review, approved, implemented, verified, deleted]
    initial: draft
    onContentChange: { from: [approved, implemented, verified], to: in_review }
```

`onContentChange` gives the RE rule "editing an approved requirement sends it back to
review". Whether that rule is on is a project setting (P2).

### 3.5 Baselines and verification

- A baseline stays a git tag. Comparing baselines is a git diff interpreted through the
  registry (field-level diffs per artifact).
- Later: test results recorded against a baseline ("TC-007 passed on baseline 1.2"),
  instead of a single status on the test case. Not part of the first refactoring.

## 4. On-disk format

```
my-project/                 ← one git repository = one project
  tracyfy.yaml              ← project config: name, schema version, custom fields,
                               traceability rules, lifecycles, saved filters
  requirements/REQ-001.md
  use-cases/UC-001.md
  test-cases/TC-001.md
  information/INFO-001.md
  risks/RISK-001.md
  documents/DOC-001.md
  links/LINK-001.md
  assets/…
```

- Everything is plain text a person can read and edit. Each artifact file is a short
  frontmatter block (status, priority, dates…) plus readable markdown: the title, then the
  text fields as `## ` sections (`## Description`, `## Rationale`…). Text fields are never
  moved into the frontmatter. The file name is the ID; the file does not repeat it.

  ```
  ---
  title: Login timeout
  status: approved
  priority: high
  revision: "02"
  ---

  # Login timeout

  ## Description
  The session ends after inactivity.

  ## Requirement Text
  The system shall log out a user after 15 minutes of inactivity.
  ```

- Frontmatter is parsed with the `yaml` package and validated with zod
  (`src/domain/artifactFormat.ts`, one description per kind). Invalid files show up as a
  notice in the UI (path and reason) and are left out. They are not silently turned into
  wrong data. The format of each kind is derived from its fields in the registry. Times are
  ISO 8601 (`dateCreated: 2026-11-17T13:15:18.275Z`).
- `tracyfy.yaml` has a `schemaVersion`. Future format changes are explicit migrations
  keyed on it.
- Removed: `projects/`, `counters/`, `users/`, `baselines/`, `project.md` and
  `custom-attributes/` (moved into `tracyfy.yaml`), `.git/tracyfy-current-*`, `workflows/`.
  `saved-filters/` stays until the open question in §8 is decided.

## 5. Architecture

```
src/
  domain/        pure TS: registry, field defs, schemas, link rules, lifecycle,
                 fingerprints, gap analysis, impact analysis, diff
  storage/       ProjectRepository interface + FsGitRepository implementation
                 (Electron and browser adapters; shared/gitOps.js underneath)
  state/         one store: loaded project, pending changes, selection, UI state
  ui/
    generic/     ArtifactTable, ArtifactForm, ArtifactDetail, FieldInput,
                 FieldValue, LinkDialog, filters: all driven by the registry
    kinds/       the few kind-specific overrides (document editor, use case flows)
    pages/       thin route components
    styles/      tokens + component classes (no inline styles)
  export/        PDF, Excel, JSON: iterate the registry
```

Rules:

- `domain` imports nothing from the other layers. `ui` never touches `storage` directly.
  It goes through `state` actions.
- The repository API is small and kind-agnostic: `load()`, `save(artifact)`,
  `delete(id)`, `status()`, `commit(paths, msg)`, `history(id)`, `baselines()`, `pull()`,
  `push()`.
- **State**: a single external store, either Zustand or `useSyncExternalStore`, with
  selectors. This replaces the nested providers and the derived-state provider. Components
  subscribe to exactly what they read, which also fixes the re-render cost of large
  contexts.
- **Styling**: CSS classes on the existing tokens (`variables.css`, themes). Inline style
  only for truly dynamic values, such as a computed position or a kind color passed as a CSS
  variable.

## 6. Testing strategy

- **Domain**: plain unit tests with no mocks: rules, suspect detection, ID allocation,
  schema validation, serialization round-trips (property-based where useful).
- **Integration**: the existing harness (whole app, real disk, real git, driven through the
  UI) is the safety net for every refactoring step and stays the main test layer.
- **E2E**: Playwright for a handful of critical journeys.
- Tests that only prove a mock was called are deleted as the code they cover is replaced.
- Every new test must be shown to fail without the change it covers.

## 7. Migration plan

Each step is a few commits, ships with all tests green, and leaves the app working. The
order is chosen so that each step makes the next one smaller.

1. ✅ **Delete multi-project and the library** (D1, D2) - done. Pure removal, so it is the biggest
   simplification for the least risk. Project membership lists, project switching, the library,
   link scope and `projectIds` all go.
2. ✅ **Domain registry + one vocabulary** (§3.1) - done. `src/domain/artifactKinds.ts`
   replaces `LINKABLE_TYPES`, `TRACE_TYPES`, `ARTIFACT_CONFIG` and the 'usecase' /
   'usecases' / 'useCases' / 'uc' variants. Opening an artifact from its ID is one hook
   (`useOpenArtifact`).
3. ✅ **One link model** (§3.3, without rules yet) - done. `requirementIds`, `useCaseIds`,
   `linkedArtifacts` and the legacy migration are gone; artifact files hold no relations.
   Link types live in `src/domain/linkTypes.ts`, and `src/domain/links.ts` answers "what does X
   relate to" from the links, reading a link from either end (`TC verifies REQ` and
   `REQ verified_by TC` are the same fact). The test case list, graph and PDF/Excel export
   read relations from there.
4. ✅ **Storage layer + new file format** (§4, P4, P5) - done. IDs come from file names
   (`src/domain/ids.ts`, `src/storage/idAllocator.ts`); the counters folder and permanent
   delete are gone. The user is the git author (`user.name`/`user.email` in `.git/config`);
   the users folder is gone. `tracyfy.yaml` holds name, description and custom attribute
   definitions. Links and custom attributes are ordinary pending changes: nothing is
   auto-committed any more except workflow approvals (step 7). A baseline is only a git tag.
   One codec (`src/domain/artifactFormat.ts`) reads and writes every kind with zod
   validation, and `src/storage/repository.ts` is the one storage API the app uses.
5. ✅ **Single store** (§5) - done. One zustand store in `src/state/` replaces all sixteen
   providers. It is made per mounted app (`StoreProvider`), so a remount starts clean, and is
   split into slices: project (folder, `artifacts` by kind, links, custom attribute
   definitions), artifacts (`addArtifact` / `updateArtifact` / `deleteArtifact` /
   `restoreArtifact` / `editArtifact`, the same for every kind), git, user, baselines, UI,
   tasks and toasts. Components read it with selectors; the per-kind providers and their
   `handleAddRequirement`-style APIs are gone. Component tests render with a real, seeded
   store (`src/test/renderWithStore.tsx`) instead of mocking hooks.
6. ✅ **Generic UI** (§3.2) - done. Each kind in the registry lists its fields
   (`FieldDef` in `src/domain/fields.ts`: type, options, default, form tab, table default);
   custom attributes become the same `FieldDef`, and `fieldsFor(kind, customAttributes)`
   is the one list everything iterates. The file codec is derived from the fields, and times
   in files are ISO 8601 (epoch ms from older files are still read). `ArtifactDialog`,
   `ArtifactsPage` and the column menu in `src/ui/generic/` replace the six modals, seven form
   hooks, six lists and six pages; `src/ui/kinds/` holds the only kind-specific parts (document
   outline and PDF export, a risk's level, a test case's verified requirements, kind icons).
   Advanced search (`src/domain/search.ts`) and the snapshot viewer cover every kind. Table
   columns are remembered per user and project folder (local storage). The UI changes custom
   attributes and links only through store actions; `useLinkService` is gone.
7. ✅ **RE features** - done.
   - **Lifecycle** (P6, `src/domain/lifecycle.ts`): each kind's statuses come from its
     lifecycle, and a file with a status its kind does not have is reported. Review is
     draft → in_review → approved. Editing the content of an approved artifact sends it back
     to in_review, unless `lifecycle.reviewOnContentChange: false` is set in tracyfy.yaml
     (Project Settings has a checkbox for it).
   - **Review page** (`src/pages/ReviewPage.tsx`, replaces workflows): Approve or Send back
     commits the decision at once, authored by the user, with the comment in the commit
     message. This is the only automatic commit left, by the user's choice.
   - **Traceability rules** (P2, `src/domain/traceability.ts`): `allowed` and `coverage` are
     defaults that tracyfy.yaml can replace. The link dialog offers only allowed relations,
     read from where the user starts. The gap list reports coverage rules by name, links the
     rules do not allow, orphan links and suspect links.
   - **One direction per fact**: the inverse types (`verified_by`, …) and parent/child are
     gone. "Verified by" is only how `TC verifies REQ` reads from the requirement.
     `mitigates` is new.
   - **Suspect links** (P3, `src/domain/fingerprint.ts`): a link stores `reviewed`, the
     fingerprint of its target's title and text fields. Suspect links show on the artifact,
     in the gap list, on the Review page and in Pending Changes ("Makes N links suspect"),
     each with Mark reviewed. A link without a fingerprint has never been reviewed, so it
     is suspect.
   - Link files keep `LINK-NNN` names (decided against naming them by fact).
8. **Export** (PDF, Excel, JSON) rewritten over the registry.

Styling moves to classes continuously, whenever a component is touched in steps 5–8.

Steps 1–6 are refactoring: behavior stays the same, except where D1, D2 and D4 remove
features on purpose. Step 7 is new functionality, and only becomes cheap after 1–6.

### Found along the way

Things noticed while doing a step that belong to a later one:

- **PDF and Excel export miss kinds**: revision history in the PDF only covers requirements,
  use cases, test cases and information. This gets fixed by the rewrite in step 8.
- **Left after step 2**: the JSON import/export keys its collections by state name
  (`useCases`). It goes with the export rewrite in step 8.
- **Left after step 4**:
  - A removed link deletes its file, so the highest link ID can be handed out again. Naming
    link files by fact was considered in step 7 and not chosen.
  - Tags are not pushed with Push; a baseline only exists in the local clone until it is.
- **Left after step 5**:
  - The sidebar's sync status (ahead/behind) still runs on window events (`git-check`,
    `git-status-changed`) and its own polling, not on store state.
- **Left after step 6**:
  - Other enum values than status (priority, a risk's probability) are still not checked
    when a file is read.
  - Custom attribute values are not validated against their definitions when a file is read,
    on purpose: renaming a dropdown option must not make every file that uses it unreadable.
    The dialog enforces required attributes when saving.
  - PDF and Excel export read the custom attribute definitions themselves
    (`diskCustomAttributeService`) and list kinds and fields by hand; step 8.
  - Changes users will notice: a requirement's Comments tab is now part of Details, the
    requirement "Approved" column is gone (Status shows it), a risk's broken Severity column
    is its Level, an information's description can be edited, and fields that were stored but
    not editable (a requirement's category) now are.
  - `BaseArtifactModal`, the Links page and the search dialog still have many inline styles.
- **Left after step 7**:
  - The traceability rules can only be edited in tracyfy.yaml; there is no UI for them.
  - The fingerprint covers the title and text fields. Enum fields (a risk's impact) and
    custom attributes do not make a link suspect.
  - Approving commits the artifact's file as it is, so its other uncommitted edits go into
    the approval commit. That is intended: you approve what you see.
  - `people` in the store (commit authors) was only used for workflow assignees and has no
    reader left.
  - After the link dialog closes, the artifact dialog it was opened from is back on its
    Overview tab.
  - The traceability dashboard and the link dialog (`LinkModal`) still use inline styles.

## 8. Open questions

- P1–P7 above.
- **Revision numbers** ("01", "02"…): keep a stored per-artifact revision bumped on commit,
  or show git history only? Recommendation: bump on commit, so the number means "committed
  version". Today it changes on every save.
- **Saved filters**: keep them in `tracyfy.yaml` (shared with the team) or per user (in
  `.git/`, not shared)? Recommendation: shared.
