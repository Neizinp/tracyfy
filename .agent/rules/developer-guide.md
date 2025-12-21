---
trigger: always_on
---

# Tracyfy Developer Guide

This guide outlines the architectural patterns and best practices for developing the Tracyfy application. Follow these standards to ensure consistency, type safety, and maintainability.

---

## 🏗 Architecture Overview

Tracyfy follows a modular architecture organized into layers:

1.  **UI Components (`src/components/`)**: Atomic and composite UI elements.
2.  **Pages (`src/pages/`)**: Top-level page components mapped to routes.
3.  **Providers (`src/app/providers/`)**: React Context providers for global state and cross-cutting concerns.
4.  **Hooks (`src/hooks/`)**: Reusable logic, form management, and context consumers.
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

All modals must be registered in `src/components/ModalManager.tsx`. This component listens to the `activeModal` state from the `UIContext`.

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

We use **Isolation Mocking** to keep tests fast and reliable:

1.  **Mock All Providers**: Use `vi.mock('../../app/providers')` to mock hooks like `useUI` and `useGlobalState`.
2.  **Type-Safe Mocks**: Use `vi.mocked()` for better developer experience and use `as unknown as ProviderValue` to satisfy TypeScript for partial mocks.
3.  **Avoid Real FS**: Never use real service logic in component tests; mock the service responses.

Example of a type-safe mock:

```typescript
const mockedUseUI = vi.mocked(useUI);
mockedUseUI.mockReturnValue({
  openModal: vi.fn(),
  activeModal: { type: null },
} as unknown as UIContextValue);
```

---

## 🚀 How to Add a New Artifact Type

1.  **Type**: Define the interface in `src/types/index.ts`.
2.  **Service**: Create a new `disk[Name]Service.ts` extending `BaseArtifactService`.
3.  **Provider**: Add a project-level provider in `src/app/providers/ArtifactProviders/`.
4.  **Modal**: Create the modal component using `BaseArtifactModal`.
5.  **Register**: Add the modal to `ModalManager.tsx` and the page route to `AppRoutes.tsx`.

---

_Last Updated: December 2025_
