# ReqTrace - Requirement Management Tool

A modern, web-based requirement management tool inspired by IBM Rational Doors. Built with React, TypeScript, and Vite for managing system requirements, use cases, test cases, and comprehensive documentation with multi-project support.

## ✨ Features

### Project Management

- **Multi-Project Support** - Manage multiple independent projects in a single workspace
- **Global Artifact Library** - Reuse artifacts (requirements, use cases, test cases, information) across projects
- **Project Switching** - Seamlessly switch between projects with independent artifact sets
- **Demo Project** - Pre-populated example project for quick exploration

### Core Functionality

- **Hierarchical Requirements** - Organize requirements in parent-child relationships
- **Drag & Drop** - Intuitive reordering and restructuring of requirements
- **Use Cases** - Define and manage use cases with actors, flows, preconditions, and postconditions
- **Test Cases** - Create test cases linked to requirements for verification tracking
- **Information Management** - Store project notes, meeting minutes, and decisions
- **Requirement Links** - Create relationships between requirements (relates to, depends on, conflicts with)
- **Traceability Matrix** - Visualize requirement relationships and dependencies across projects
- **Trash Bin** - Soft delete with restore capability for all artifact types

### Revision Control & Baselines

- **Revision Tracking** - Automatic revision numbering for all artifacts (starts at "01", increments on changes)
- **Baseline Management** - Create project baselines to snapshot artifact states
- **Baseline Comparison** - Compare current state against baselines
- **Pending Changes** - Git-style pending changes view showing new/modified artifacts
- **Commit System** - Commit artifact changes with messages

### Data Management

- **Auto-Save** - All changes automatically saved to browser LocalStorage
- **Export/Import** - Backup and restore data as JSON files
- **Comprehensive PDF Export** - Professional PDF documents with:
  - Cover page with project metadata
  - Table of contents with page numbers
  - All artifact types with full details (text, rationale, flows, etc.)
  - Revision history
  - Baseline information
  - **File Save Dialog** - Choose where to save PDFs using modern browser API
- **Excel Export** - Download structured spreadsheets with multi-sheet support
- **Persistent Storage** - Data survives page refreshes and browser restarts

### Views & Interfaces

- **Requirements Tree** - Hierarchical view with drag-and-drop
- **Detailed View** - Tabular view with customizable column visibility
- **Traceability Matrix** - Visual relationship mapping
- **Use Cases View** - Dedicated use case management interface
- **Test Cases View** - Test management and requirement traceability
- **Information View** - Notes and documentation management
- **Baselines View** - Baseline creation and management
- **Global Library** - Browse and add artifacts from any project

### Requirement Fields

- ID (auto-generated, sequential: REQ-001, REQ-002, etc.)
- Title
- Description
- Requirement Text (full details with Markdown support)
- Rationale (why the requirement exists)
- Status (draft, approved, implemented, verified)
- Priority (low, medium, high)
- Revision (auto-incremented: 01, 02, 03, etc.)
- Parent relationships (multi-parent support)
- Use case associations
- Baseline version (if baselined)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Neizinp/requirement-management-tool.git
cd requirement-management-tool

# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron (runs Vite dev server + Electron shell)
npm run electron:dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build

# Launch Electron against the production build
npm run electron:start
```

## 📖 Usage

### Managing Projects

1. Click **"New Project"** to create a new project
2. Switch between projects using the project selector
3. Each project maintains its own set of artifacts
4. Delete projects that are no longer needed

### Creating Requirements

1. Select a project
2. Click **"Create New"** → **"New Requirement"**
3. Fill in title, requirement text, rationale, and other fields
4. Submit to create - data auto-saves immediately
5. Revision automatically set to "01"

### Managing Hierarchy

- **Drag and drop** requirements to reorganize
- Requirements can have multiple parents
- Visual indicators show multi-parent relationships

### Creating Links

1. Click the **link icon** on any requirement
2. Select target requirement (can be from any project)
3. Choose link type (relates to, depends on, conflicts with)

### Use Cases

1. Switch to **"Use Cases"** view
2. Click **"Create New"** → **"New Use Case"**
3. Define actors, preconditions, main flow, alternative flows, and postconditions
4. Link to related requirements

### Test Cases

1. Switch to **"Test Cases"** view
2. Click **"Create New"** → **"New Test Case"**
3. Define test description and link to requirements
4. Track verification status

### Creating Baselines

1. Switch to **"Baselines"** view
2. Click **"Create Baseline"**
3. Provide version name and description
4. All current artifact revisions are captured

### Global Library (Multi-Project)

1. Click **"Library"** button
2. Filter by project to see available artifacts
3. Drag artifacts from library into current project
4. Artifacts can be used in multiple projects simultaneously
5. Editing an artifact updates it across all projects (global state)

### Trash Bin

1. Delete any artifact (moves to trash)
2. Click **"Trash"** button to view deleted items
3. Restore items or permanently delete

### Export Options

- **PDF**: Comprehensive document with cover page, table of contents, all artifacts, revision history
  - Prompts for save location using modern file picker
  - Includes project metadata and baseline information
- **Excel**: Structured spreadsheet data
- **JSON**: Full data backup/restore

## 🏗️ Architecture

### Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **@dnd-kit** - Drag and drop functionality
- **Lucide React** - Icon library
- **jsPDF** - PDF generation
- **jsPDF-AutoTable** - PDF table formatting
- **SheetJS (xlsx)** - Excel export

### Testing

- **Vitest** - Unit and component testing (15 tests)
- **Playwright** - End-to-end testing (3 passing, 3 deferred)
- **React Testing Library** - Component testing utilities

### Project Structure

```
src/
├── components/
│   ├── Layout.tsx              # Main layout with sidebar
│   ├── RequirementTree.tsx     # Hierarchical tree view
│   ├── NewRequirementModal.tsx # Create requirement form
│   ├── EditRequirementModal.tsx # Edit requirement form
│   ├── LinkModal.tsx           # Create links between requirements
│   ├── TraceabilityMatrix.tsx  # Relationship visualization
│   ├── UseCaseModal.tsx        # Create/edit use cases
│   ├── UseCaseList.tsx         # Use case management
│   ├── TestCaseList.tsx        # Test case management
│   ├── InformationList.tsx     # Information management
│   ├── ProjectManager.tsx      # Multi-project management
│   ├── TrashModal.tsx          # Soft delete management
│   ├── GlobalLibraryPanel.tsx  # Global artifact library
│   └── VersionHistory.tsx      # Baseline and revision history
├── utils/
│   ├── pdfExportUtils.ts       # Comprehensive PDF generation
│   ├── revisionUtils.ts        # Revision number management
│   ├── dateUtils.ts            # Date formatting utilities
│   └── markdownUtils.ts        # Markdown processing
├── types.ts                    # TypeScript type definitions
├── App.tsx                     # Main application component
└── index.css                   # Global styles
```

### Data Model

**Project**

```typescript
{
  id: string;
  name: string;
  description: string;
  requirementIds: string[];    // IDs of requirements in this project
  useCaseIds: string[];        // IDs of use cases in this project
  testCaseIds: string[];       // IDs of test cases in this project
  informationIds: string[];    // IDs of information items
  currentBaseline?: string;    // Current baseline ID
  lastModified: number;
}
```

**Requirement**

```typescript
{
  id: string;              // REQ-001, REQ-002, etc.
  title: string;
  description: string;
  text: string;            // Full requirement text
  rationale: string;       // Why this requirement exists
  parentIds: string[];     // Array of parent requirement IDs
  useCaseIds?: string[];   // Associated use cases
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  priority: 'low' | 'medium' | 'high';
  revision: string;        // "01", "02", "03", etc.
  lastModified: number;
}
```

**Use Case**

```typescript
{
  id: string;              // UC-001, UC-002, etc.
  title: string;
  description: string;
  actor: string;           // Who performs this use case
  preconditions: string;
  postconditions: string;
  mainFlow: string;
  alternativeFlows?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'approved' | 'implemented' | 'verified';
  revision: string;
  lastModified: number;
}
```

**Test Case**

```typescript
{
  id: string;              // TC-001, TC-002, etc.
  title: string;
  description: string;
  requirementIds: string[]; // Requirements this test verifies
  status: 'draft' | 'approved' | 'passed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  revision: string;
  lastModified: number;
}
```

## 🎨 Design

- **Dark Theme** - Modern dark UI with glassmorphism effects
- **Responsive** - Works on desktop and tablet devices
- **Accessible** - Semantic HTML and keyboard navigation
- **Visual Feedback** - Hover states, transitions, and animations
- **Professional Exports** - Publication-quality PDF documents

## 🔒 Data Privacy

- All data stored locally in browser LocalStorage
- No external servers or cloud storage
- Export feature allows manual backups
- Private GitHub repository for code

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm test         # Run Vitest unit/component tests
npx playwright test  # Run E2E tests
```

### Testing

**Unit/Component Tests** (Vitest)

- `src/utils/__tests__/revisionUtils.test.ts` - Revision numbering logic
- `src/components/__tests__/ProjectManager.test.tsx` - Project management
- `src/components/__tests__/MarkdownEditor.test.tsx` - Markdown editor

**E2E Tests** (Playwright)

- `e2e/basic-flow.spec.ts` - Core CRUD operations
- `e2e/revision-baseline.spec.ts` - Revision tracking and baselines
- `e2e/use-case-flow.spec.ts` - Use case workflow
- `e2e/multi-project-artifacts.spec.ts` - Multi-project artifact sharing
- `e2e/pdf-export.spec.ts` - Comprehensive PDF export

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Strict mode enabled
- Comprehensive test coverage for critical paths

## 📝 Recent Updates

### Version 2.0 (November 2024)

- ✅ **Multi-project support** with global artifact library
- ✅ **Comprehensive PDF export** with file save dialog, table of contents, and all artifact types
- ✅ **Revision tracking** with automatic numbering (01, 02, 03...)
- ✅ **Baseline management** for version control
- ✅ **Trash bin** with soft delete and restore
- ✅ **Testing infrastructure** (Vitest + Playwright)
- ✅ **Global artifact sharing** - artifacts can be used in multiple projects
- ✅ Fixed critical multi-project artifact bug
- ✅ E2E test coverage for critical workflows

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. Contributions are not currently accepted.

## 📧 Contact

For questions or issues, please contact the repository owner.

---

**Built with ❤️ using React + TypeScript + Vite**
