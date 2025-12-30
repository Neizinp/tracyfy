import React from 'react';
import {
  Book,
  Target,
  GitBranch,
  Users,
  ShieldAlert,
  Link as LinkIcon,
  ArrowLeft,
  Keyboard,
  Info,
  Search,
  Lock,
  Download,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <section style={{ marginBottom: 'var(--spacing-xl)' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-md)',
      }}
    >
      <div
        style={{
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-accent)',
        }}
      >
        {icon}
      </div>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, margin: 0 }}>{title}</h2>
    </div>
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: 'var(--spacing-lg)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      {children}
    </div>
  </section>
);

const FeatureCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div style={{ marginBottom: 'var(--spacing-md)' }}>
    <h3
      style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 500,
        marginBottom: '4px',
        color: 'var(--color-text-primary)',
      }}
    >
      {title}
    </h3>
    <p style={{ color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
      {description}
    </p>
  </div>
);

export const ProjectManual: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: 'var(--spacing-xl)',
        color: 'var(--color-text-primary)',
      }}
    >
      <button
        onClick={() => navigate('/help')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--color-accent)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
          marginBottom: 'var(--spacing-xl)',
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Back to Knowledge Hub
      </button>

      <header style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          Tracyfy User Manual
        </h1>
      </header>

      <Section title="Getting Started" icon={<Book size={20} />}>
        <FeatureCard
          title="The Atomic Philosophy"
          description="Tracyfy is built on the philosophy of 'Atomic Markdown.' Every requirement, risk, or test case is stored as an individual, human-readable Markdown file. This ensures your data remains portable, transparent, and perfectly suited for version control."
        />
        <FeatureCard
          title="Project Navigation"
          description="Use the sidebar to navigate between different views: Requirements, Use Cases, Test Cases, Information, and Risks. The Traceability Dashboard provides a birds-eye view of your project's health."
        />
      </Section>

      <Section title="Artifact Types" icon={<Layers size={20} />}>
        <FeatureCard
          title="Requirements (REQ)"
          description="Capture what your system must do. Requirements include a title, detailed text, rationale, status, priority, category, and verification method. They form the foundation of your engineering specification."
        />
        <FeatureCard
          title="Use Cases (UC)"
          description="Define user interactions and system behaviors. Use Cases describe actors, preconditions, postconditions, main flows, and alternative flows. Link them to Requirements to show how functionality is realized."
        />
        <FeatureCard
          title="Test Cases (TC)"
          description="Verify that requirements are met. Test Cases include step-by-step instructions, expected results, and execution status. Link them to Requirements to establish verification traceability."
        />
        <FeatureCard
          title="Information (INFO)"
          description="Store supplementary content such as notes, references, glossary entries, or background context. Information artifacts help keep your project documentation organized without cluttering requirements."
        />
        <FeatureCard
          title="Documents (DOC)"
          description="Create structured documents by composing headings and artifact references. Documents let you assemble Requirements, Use Cases, and other artifacts into formal specification documents for export."
        />
        <FeatureCard
          title="Risks (RISK)"
          description="Identify and track project or technical risks. Capture probability, impact, mitigation strategies, contingency plans, and assign owners. Link risks to affected Requirements for impact analysis."
        />
        <FeatureCard
          title="Workflows (WF)"
          description="Manage approval and review processes. Workflows track the lifecycle of artifacts through states, recording who approved what and when. Use them for formal change control."
        />
        <FeatureCard
          title="Links"
          description="Establish traceability relationships between any two artifacts. Links define how artifacts relate to each other—for example, a Test Case verifies a Requirement, or a Risk impacts a Use Case. Links are bidirectional and visible from both connected artifacts."
        />
        <FeatureCard
          title="Custom Attributes"
          description="Extend any artifact type with your own fields. Define text, number, date, or dropdown attributes to capture project-specific metadata. Custom Attributes are configured per-project and appear in artifact modals and list views."
        />
      </Section>

      <Section title="Managing Artifacts" icon={<Target size={20} />}>
        <FeatureCard
          title="Creating Requirements"
          description="Click 'Create New' in the header to add requirements. You can define details like priority, status, and rich descriptions."
        />
        <FeatureCard
          title="The Global Library"
          description="Import existing artifacts from other projects using the Global Library. This allows for content reuse across your entire workspace."
        />
        <FeatureCard
          title="Custom Attributes"
          description="Define your own fields for any artifact type to match your specific engineering process."
        />
      </Section>

      <Section title="Traceability & Links" icon={<LinkIcon size={20} />}>
        <FeatureCard
          title="Establishing Links"
          description="Link artifacts together (e.g., a Test Case verifying a Requirement) using the Links page. Tracyfy automatically tracks these relationships and visualizes them."
        />
        <FeatureCard
          title="Traceability Dashboard"
          description="Monitor linkage coverage and identify 'gaps' where requirements might be missing test cases or use cases."
        />
      </Section>

      <Section title="Version Control & Baselines" icon={<GitBranch size={20} />}>
        <FeatureCard
          title="Atomic Commits"
          description="Tracyfy follows an 'atomic commit' pattern where each file is committed separately. This keeps your version history clean and provides a precise audit trail for every individual requirement or artifact."
        />
        <FeatureCard
          title="Creating Baselines"
          description="Snapshots of your project's state can be saved as Baselines. These are useful for milestone reviews and comparing changes over time."
        />
      </Section>

      <Section title="Workflow & Approvals" icon={<Users size={20} />}>
        <FeatureCard
          title="Approval Workflows"
          description="Set up structured approval processes for your artifacts. Once approved, the status is automatically updated and tracked."
        />
      </Section>

      <Section title="Risk Management" icon={<ShieldAlert size={20} />}>
        <FeatureCard
          title="Analyzing Risks"
          description="Identify technical and project risks early. Assign probability, impact, and mitigation strategies to ensure project success."
        />
      </Section>

      <Section title="Search & Discovery" icon={<Search size={20} />}>
        <FeatureCard
          title="Quick Search (Ctrl + K)"
          description="The global search bar allows for instant lookup of any artifact by ID, title, or content. It's the fastest way to jump between requirements."
        />
        <FeatureCard
          title="Advanced Filtering"
          description="Use the filter bar on page views to narrow down artifacts by status, priority, or custom attributes. Combined with column visibility, you can create custom views for your specific needs."
        />
      </Section>

      <Section title="Data Ownership & Privacy" icon={<Lock size={20} />}>
        <FeatureCard
          title="Local-First Engineering"
          description="Your engineering data stays where it belongs: on your machine. Tracyfy works directly with your local file system, ensuring zero dependency on cloud services for core work."
        />
        <FeatureCard
          title="Markdown Transparency"
          description="Every artifact is stored as a standard Markdown file. There are no proprietary database formats, meaning your data is always accessible, portable, and future-proof."
        />
      </Section>

      <Section title="Import & Export Workflows" icon={<Download size={20} />}>
        <FeatureCard
          title="Professional PDF Reporting"
          description="Generate comprehensive PDF documents for milestones or compliance reviews. You can customize the sections, including title pages and traceability matrices."
        />
        <FeatureCard
          title="Excel & JSON Exports"
          description="Export data to Excel for external stakeholders or use JSON for integration with other engineering toolchains. Tracyfy ensures all linked data is preserved in the export."
        />
      </Section>

      <Section title="Keyboard Shortcuts" icon={<Keyboard size={20} />}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
          }}
        >
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <kbd
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border)',
                marginRight: '8px',
              }}
            >
              F1
            </kbd>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>Help Manual</span>
          </div>
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <kbd
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border)',
                marginRight: '8px',
              }}
            >
              Ctrl + K
            </kbd>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>Quick Search</span>
          </div>
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <kbd
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border)',
                marginRight: '8px',
              }}
            >
              Esc
            </kbd>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>Close Modal</span>
          </div>
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <kbd
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border)',
                marginRight: '8px',
              }}
            >
              Ctrl + S
            </kbd>
            <span style={{ fontSize: 'var(--font-size-sm)' }}>Save Changes</span>
          </div>
        </div>
      </Section>

      <footer
        style={{
          marginTop: 'var(--spacing-2xl)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--spacing-lg)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <Info size={14} />
          Tracyfy Version 1.0.0
        </p>
      </footer>
    </div>
  );
};
