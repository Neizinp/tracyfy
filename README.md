# Tracyfy - Requirement Management Tool

A modern, web-based requirement management tool inspired by IBM Rational Doors. Built with React, TypeScript, and Vite for managing system requirements, use cases, test cases, and comprehensive documentation with multi-project support and Git-based version control.

## ✨ Features

### Project Management

- **Multi-Project Support** - Manage multiple independent projects in a single workspace
- **Repository Selection** - Select local Git repositories as project storage
- **Global Artifact Library** - Reuse artifacts (requirements, use cases, test cases, information) across projects
- **Project Switching** - Seamlessly switch between projects with independent artifact sets
- **Demo Project** - Pre-populated example project for quick exploration

### Core Functionality

- **Hierarchical Requirements** - Organize requirements in parent-child relationships
- **Use Cases** - Define and manage use cases with actors, flows, preconditions, and postconditions
- **Test Cases** - Create test cases linked to requirements for verification tracking
- **Information Management** - Store project notes, meeting minutes, and decisions
- **Artifact Links** - Create relationships between artifacts (relates to, depends on, conflicts with) - stored directly within each artifact
- **Traceability Matrix** - Visualize requirement relationships and dependencies
- **Trash Bin** - Soft delete with restore capability for all artifact types

### Advanced Features

- **Electron Mode** - Native desktop app with faster Git operations using native Git
- **Advanced Search** - Query builder with complex filters and saved search templates
- **User Management** - Multi-user support with author tracking and user switching
- **Remote Git Sync** - Push/pull to remote Git repositories for team collaboration
- **Custom Attributes** - Extend artifacts with custom fields per project
- **Workflow Management** - Track approval workflows with status and assignment

### Revision Control & Baselines

- **Git Integration** - All artifacts stored as Markdown files in Git repositories
- **Revision Tracking** - Automatic revision numbering for all artifacts (starts at "01", increments on changes)
- **Baseline Management** - Create project baselines as Git tags to snapshot artifact states
- **Baseline History** - View and compare baselines with revision history
- **Pending Changes** - Git-style pending changes view showing new/modified artifacts
- **Commit System** - Commit artifact changes with messages directly to Git

### Data Management

- **Markdown Storage** - All artifacts stored as human-readable Markdown files with YAML frontmatter
- **Export/Import** - Backup and restore data as JSON files
- **Comprehensive PDF Export** - Professional PDF documents with:
  - Cover page with project metadata
  - Table of contents with page numbers for each artifact
  - All artifact types with full details (text, rationale, flows, etc.)
  - Revision history
  - Baseline information
- **Excel Export** - Download structured spreadsheets with multi-sheet support including traceability matrix
- **File System Access** - Direct access to local file system via File System Access API

### Views & Interfaces

- **Requirements Tree** - Hierarchical view with drag-and-drop
- **Detailed View** - Tabular view with customizable column visibility
- **Traceability Matrix** - Visual relationship mapping
- **Use Cases View** - Dedicated use case management interface
- **Test Cases View** - Test management and requirement traceability
- **Information View** - Notes and documentation management
- **Baselines View** - Baseline creation and history viewing
- **Global Library** - Browse and add artifacts from any project

### Artifact Fields

**Requirements** - ID (REQ-001), Title, Description, Requirement Text, Rationale, Status, Priority, Revision, Parent relationships, Linked artifacts

**Use Cases** - ID (UC-001), Title, Description, Actor, Preconditions, Main Flow, Alternative Flows, Postconditions, Status, Priority, Revision

**Test Cases** - ID (TC-001), Title, Description, Requirement coverage, Status (draft/passed/failed/blocked), Priority, Revision

**Information** - ID (INFO-001), Title, Content (Markdown), Type (meeting/decision/note/other), Revision

**Risks** - ID (RISK-001), Title, Description, Probability, Impact, Mitigation, Category, Owner, Status, Revision

**Documents** - ID (DOC-001), Title, Description, Structure (composed of headings and artifact references), Author, Status, Revision

**Workflows** - ID (WF-001), Title, Description, Type, Status, Assigned To, Approval History, Revision

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git (for version control features)
- A modern browser (see Browser Support below)

### Browser Support

| Browser    | Support                                |
| ---------- | -------------------------------------- |
| Chrome 86+ | ✅ Full support                        |
| Edge 86+   | ✅ Full support                        |
| Firefox    | ⚠️ Limited (no File System Access API) |
| Safari     | ⚠️ Limited (no File System Access API) |

The File System Access API is required for local file storage. Use Chrome or Edge for the best experience.

### Installation

```bash
# Clone the repository
git clone https://github.com/Neizinp/tracyfy.git
cd tracyfy

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Electron Mode (Recommended)

For better performance with native Git operations:

```bash
# Install Electron dependencies
npm install

# Run in Electron mode
npm run electron:dev
```

Electron mode provides:

- Faster Git operations using native Git
- Better file system performance
- No browser limitations

### First Run

1. On first launch, you'll be prompted to select a local directory
2. Choose an existing Git repository or create a new folder
3. If Git isn't initialized, Tracyfy will set it up for you
4. All data is stored locally - no cloud account needed

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## 📖 Usage

### Getting Started with a Repository

1. Click **"Select Repository"** to choose a local Git repository
2. The application will load all artifacts from the repository
3. Create new artifacts or edit existing ones
4. Changes appear in the **Pending Changes** panel
5. Commit changes to save them to Git

### Creating Requirements

1. Select a project
2. Click **"Create New"** → **"New Requirement"**
3. Fill in title, requirement text, rationale, and other fields
4. Submit to create - revision automatically set to "01"
5. The file is saved as Markdown in `requirements/REQ-XXX.md`

### Managing Hierarchy

- Requirements can have multiple parents via links
- Visual indicators show parent-child relationships in tree view

### Creating Links

1. Click the **link icon** on any artifact
2. Select target artifact from the modal
3. Choose link type (relates to, depends on, conflicts with)
4. Links are stored in the source artifact's `linkedArtifacts` field

### Creating Baselines

1. Switch to **"Baselines"** view
2. Click **"Create Baseline"**
3. Provide version name (e.g., "v1.0") and description
4. A Git tag is created capturing all current artifact states

### Export Options

- **PDF**: Comprehensive document with cover page, granular table of contents, all artifacts
- **Excel**: Structured spreadsheet with Requirements, Use Cases, Test Cases, Information, and Traceability Matrix sheets
- **JSON**: Full data backup/restore

## 🏗️ Architecture

### Tech Stack

- **React 18** - UI framework with hooks and context
- **TypeScript** - Type safety throughout
- **Vite** - Build tool and dev server
- **isomorphic-git** - Git operations in the browser
- **Lucide React** - Icon library
- **jsPDF + jsPDF-AutoTable** - PDF generation
- **SheetJS (xlsx)** - Excel export
- **gray-matter** - YAML frontmatter parsing

### Testing

- **Vitest** - 1075+ unit and component tests
- **Mode Parity Tests** - Ensures Electron and Browser modes stay in sync
- **React Testing Library** - Component testing utilities

Run tests:

```bash
npm test              # Run unit tests
npm run typecheck     # TypeScript type checking
npm run lint          # ESLint
```

> **Note:** E2E browser automation tests are not possible due to the File System Access API requiring native OS dialogs for repository selection. See `docs/TESTING_GUIDE.md` for manual testing procedures.

### Project Structure

```
src/
├── app/
│   └── providers/           # React context providers
│       ├── FileSystemProvider.tsx    # File system & Git operations
│       ├── GlobalStateProvider.tsx   # Global artifact state
│       ├── ArtifactProviders/        # Per-artifact type providers
│       └── ...
├── components/
│   ├── RequirementTree.tsx     # Hierarchical tree view
│   ├── TraceabilityMatrix.tsx  # Relationship visualization
│   ├── PendingChangesPanel.tsx # Git-style changes view
│   ├── ModalManager.tsx        # Centralized modal handling
│   └── ...
├── layouts/
│   └── ProjectLayout.tsx       # Main layout with sidebar
├── pages/                      # Route pages
├── services/
│   ├── diskProjectService.ts   # Project file operations
│   ├── realGitService.ts       # Git operations
│   └── fileSystemService.ts    # File system access
├── utils/
│   ├── markdownUtils.ts        # Artifact ↔ Markdown conversion
│   ├── pdfExportUtils.ts       # PDF generation
│   ├── excelExportUtils.ts     # Excel generation
│   └── ...
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
└── index.css                   # Global styles (CSS variables)
```

### Data Storage

Artifacts are stored as Markdown files with YAML frontmatter:

```markdown
---
id: 'REQ-001'
title: 'User Authentication'
status: 'approved'
priority: 'high'
revision: '02'
linkedArtifacts:
  - targetId: 'UC-001'
    type: 'relates_to'
---

# User Authentication

## Description

The system shall provide secure user authentication.

## Requirement Text

Users must authenticate using email and password...

## Rationale

Security is a core requirement for the system.
```

### Repository File Structure

When you select a Git repository, Tracyfy creates the following folder structure:

```
your-project-repo/
├── .tracyfy/
│   ├── project.md          # Project metadata (name, description, counters)
│   └── config.json         # Application configuration (if any)
├── requirements/
│   ├── REQ-001.md          # Each requirement is a separate Markdown file
│   ├── REQ-002.md
│   └── ...
├── use-cases/
│   ├── UC-001.md           # Use cases with actors, flows, etc.
│   └── ...
├── test-cases/
│   ├── TC-001.md           # Test cases with requirements coverage
│   └── ...
├── information/
│   ├── INFO-001.md         # Meeting notes, decisions, documentation
│   └── ...
└── .git/                   # Git repository (managed by isomorphic-git)
```

**Key points:**

- Each artifact is a separate `.md` file, making them easy to review in Git diffs
- Links between artifacts are stored in the source artifact's `linkedArtifacts` field
- Project metadata (ID counters, project info) is stored in `.tracyfy/project.md`
- Baselines are Git tags, not separate files
- The entire repository can be cloned, reviewed, and merged using standard Git workflows

## 🎨 Design

- **Dark Theme** - Modern dark UI with CSS custom properties
- **Responsive** - Works on desktop and tablet devices
- **Accessible** - Semantic HTML and keyboard navigation
- **Visual Feedback** - Hover states, transitions, and animations
- **Professional Exports** - Publication-quality PDF documents

## 🔒 Data Privacy

- All data stored locally in your Git repositories
- No external servers or cloud storage required
- Export feature allows manual backups
- Works entirely offline after initial load

## 🛠️ Development

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run typecheck # TypeScript type checking
npm test          # Run Vitest unit/component tests
npm test -- --run # Run tests once (no watch)
npx playwright test  # Run E2E tests
```

### Code Quality

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (via ESLint)
- Pre-commit hooks via lint-staged
- 1000+ unit tests with comprehensive coverage

## 📝 Recent Updates

### January 2026

- ✅ **Electron mode** - Native desktop app with faster Git operations
- ✅ **Folder management** - Non-empty folder warnings and in-app directory switching
- ✅ **Transparency fixes** - Ensured all UI elements have opaque backgrounds
- ✅ **Demo project fixes** - Resolved initialization issues in new folders

### December 2024

- ✅ **Links embedded in artifacts** - Links now stored in each artifact's `linkedArtifacts` field instead of separate `links.json`
- ✅ **Improved repository selection** - Better UX for selecting Git repositories
- ✅ **TraceabilityMatrix refactored** - Now builds links from artifact data
- ✅ **Test cleanup** - Removed outdated tests, 440+ tests passing
- ✅ **Code cleanup** - Removed `mockLinks` export and deprecated `Link` interface

### November 2024

- ✅ **Multi-project support** with global artifact library
- ✅ **Comprehensive PDF export** with granular table of contents
- ✅ **Revision tracking** with automatic numbering (01, 02, 03...)
- ✅ **Baseline management** as Git tags
- ✅ **Trash bin** with soft delete and restore
- ✅ **Testing infrastructure** (Vitest + Playwright)
- ✅ **Markdown storage** for all artifacts

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ using React + TypeScript + Vite**
