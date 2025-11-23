# ReqTrace - Requirement Management Tool

A modern, web-based requirement management tool inspired by IBM Rational Doors. Built with React, TypeScript, and Vite for managing system requirements, use cases, and traceability.

## ✨ Features

### Core Functionality
- **Hierarchical Requirements** - Organize requirements in parent-child relationships
- **Drag & Drop** - Intuitive reordering and restructuring of requirements
- **Use Cases** - Define and manage use cases with actors, flows, and conditions
- **Requirement Links** - Create relationships between requirements (relates to, depends on, conflicts with)
- **Traceability Matrix** - Visualize requirement relationships and dependencies
- **Multi-Parent Support** - Requirements can belong to multiple parent requirements

### Data Management
- **Auto-Save** - All changes automatically saved to browser LocalStorage
- **Version History** - Track changes over time with automatic snapshots and restore capability
- **Export/Import** - Backup and restore data as JSON files
- **PDF Export** - Generate professional PDF documents with requirements, use cases, and traceability matrix
- **Excel Export** - Download structured spreadsheets with multi-sheet support
- **Persistent Storage** - Data survives page refreshes and browser restarts

### Requirement Fields
- ID (auto-generated, sequential)
- Title
- Description
- Requirement Text
- Rationale
- Status (draft, approved, implemented, verified)
- Priority (low, medium, high)
- Parent relationships
- Use case associations

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
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 📖 Usage

### Creating Requirements
1. Click **"New Requirement"** in the header
2. Fill in the requirement details
3. Submit to create - data auto-saves immediately

### Managing Hierarchy
- **Drag and drop** requirements to reorganize
- Requirements can have multiple parents
- Visual indicators show multi-parent relationships

### Creating Links
1. Click the **link icon** on any requirement
2. Select target requirement
3. Choose link type (relates to, depends on, conflicts with)

### Use Cases
1. Switch to **"Use Cases"** view
2. Click **"New Use Case"** to create
3. Define actors, preconditions, flows, and postconditions

### Version History
1. Click the **clock icon** in the header
2. View timeline of auto-saved versions
3. Restore any previous version with one click

### Export Options
- **PDF**: Professional document generation
- **Excel**: Structured spreadsheet data
- **JSON**: Full data backup/restore

## 🏗️ Architecture

### Tech Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **@dnd-kit** - Drag and drop functionality
- **Lucide React** - Icon library

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
│   └── UseCaseList.tsx         # Use case management
├── types.ts                    # TypeScript type definitions
├── App.tsx                     # Main application component
└── index.css                   # Global styles
```

### Data Model

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
  lastModified: number;    // Timestamp
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
  lastModified: number;
}
```

**Link**
```typescript
{
  id: string;
  sourceId: string;        // Source requirement ID
  targetId: string;        // Target requirement ID
  type: 'relates_to' | 'depends_on' | 'conflicts_with';
  description?: string;
}
```

## 🎨 Design

- **Dark Theme** - Modern dark UI with glassmorphism effects
- **Responsive** - Works on desktop and tablet devices
- **Accessible** - Semantic HTML and keyboard navigation
- **Visual Feedback** - Hover states, transitions, and animations

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
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Strict mode enabled

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. Contributions are not currently accepted.

## 📧 Contact

For questions or issues, please contact the repository owner.

---

**Built with ❤️ using React + TypeScript + Vite**
