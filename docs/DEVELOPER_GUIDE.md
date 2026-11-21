# Tracyfy Developer Guide

This guide outlines the architectural patterns and best practices for developing the Tracyfy application. Follow these standards to ensure consistency, type safety, and maintainability.

---

## 🏗 Architecture Overview

Tracyfy follows a modular architecture organized into layers:

1.  **UI Components (`src/components/`)**: Atomic and composite UI elements.
2.  **Pages (`src/pages/`)**: Top-level page components mapped to routes.
3.  **State (`src/state/`)**: the one app store (zustand): the loaded project, pending changes, the user, dialogs and selection, and the actions that change them. Components read it with a selector, `useAppStore((s) => s.artifacts.requirement)`, so they re-render only when that value changes.
4.  **Hooks (`src/hooks/`)**: Reusable logic and form management.
5.  **Services (`src/services/`)**: Business logic and data persistence (Disk/Git).
6.  **Types (`src/types/`)**: Unified TypeScript definitions.

---

## 💾 Data Persistence (Services)

All disk-based operations must utilize the service layer.

### 🛡 `BaseDiskService`

Every new data service should extend `BaseDiskService`. It provides robust wrappers for:

- `readJsonFile` / `writeJsonFile`
- `readTextFile` / `writeTextFile`
- `readBinaryFile` / `writeBinaryFile` (with automatic `SharedArrayBuffer` handling)
- `deleteFile`
- Automatic Git commits if a `commitMessage` is provided.

### 📦 `BaseArtifactService<T>`

For standard artifacts (Requirements, Risks, etc.), extend `BaseArtifactService`. It handles CRUD patterns and integrates with `IdService`.

---

## 🖼 Modal Management

Tracyfy uses a centralized modal system to prevent z-index issues and reduce boilerplate.

### 🎛 `ModalManager`

All modals must be registered in `src/components/ModalManager.tsx`. This component reads `activeModal` from the store.

### 🧭 Navigation & Deep Linking

- **`useArtifactNavigation`**: Use this hook to jump between artifacts (e.g., clicking a link to a Requirement from a Test Case). It handles closing the current modal and opening the next one while maintaining the navigation stack.
- **`useArtifactDeepLink`**: Automatically syncs the `?id=` URL parameter with the active modal. This enables sharing direct links to specific artifacts.

---

## 📝 Form Components

Use the generic form building blocks to keep internal artifact modals consistent:

- **`BaseArtifactModal`**: The standard shell for all artifact modals.
- **`ArtifactDetailsSections`**: Standardizes the rendering of Title and Markdown description fields.
- **`ArtifactRelationshipsTab`**: Handles the linking between different artifact types.

---

## 🧪 Testing Standards

Tests check real behavior (docs/DESIGN.md §6):

1.  **Integration first**: `src/test/integration/appHarness.tsx` runs the whole app against a real folder and real git, driven through the UI. `h.app()` is the store's current state.
2.  **Components get a real store**: render with `renderWithStore` (or `storeWrapper` for `renderHook`) from `src/test/renderWithStore.tsx`, seeded with the state the component reads. Don't mock the store.
3.  **A new test must fail without the change it covers.**

```typescript
renderWithStore(<LinksView />, { state: { isReady: true, links: [] } });
expect(await screen.findByText(/No links/i)).toBeInTheDocument();
```

---

## 🚀 How to Add a New Artifact Type

1.  **Type**: Define the interface in `src/types/index.ts`.
2.  **Service**: Create a new `disk[Name]Service.ts` extending `BaseArtifactService`.
3.  **Registry**: Add the kind to `src/domain/artifactKinds.ts`. The store holds every kind in `state.artifacts[kind]` and creates, saves and deletes any kind with the same actions (`addArtifact(kind, …)`), so there is nothing to add there.
4.  **Modal**: Create the modal component using `BaseArtifactModal`.
5.  **Register**: Add the modal to `ModalManager.tsx` and the page route to `AppRoutes.tsx`.

---

_Last Updated: December 2025_
