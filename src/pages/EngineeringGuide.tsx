import React from 'react';
import { ArrowLeft, CheckCircle2, FileEdit, Activity, ShieldCheck, Zap } from 'lucide-react';
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
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
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

const PrincipleCard: React.FC<{ title: string; description: string; tip?: string }> = ({
  title,
  description,
  tip,
}) => (
  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
    <h3
      style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        marginBottom: '8px',
        color: 'var(--color-text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <CheckCircle2 size={18} style={{ color: '#10b981' }} />
      {title}
    </h3>
    <p
      style={{
        color: 'var(--color-text-secondary)',
        margin: 0,
        lineHeight: 1.6,
        marginBottom: tip ? '8px' : 0,
      }}
    >
      {description}
    </p>
    {tip && (
      <div
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderLeft: '4px solid #10b981',
          fontSize: 'var(--font-size-sm)',
          fontStyle: 'italic',
          color: 'var(--color-text-primary)',
        }}
      >
        <strong>Guideline:</strong> {tip}
      </div>
    )}
  </div>
);

export const EngineeringGuide: React.FC = () => {
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
          color: '#10b981',
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
          Engineering Methodology Guide
        </h1>
        <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)' }}>
          Principles for effective systems engineering and requirement management.
        </p>
      </header>

      <Section title="Requirement Engineering" icon={<FileEdit size={20} />}>
        <PrincipleCard
          title="The Atomic Principle"
          description="Each requirement should specify exactly one thing. If a requirement contains 'and' or 'also', it might need to be split. Atomic requirements are easier to test, trace, and manage."
          tip="Aim for a single sentence. If you need two, question if it's really one requirement."
        />
        <PrincipleCard
          title="Verifiability"
          description="A requirement is useless if you can't prove it's been met. Avoid vague terms like 'fast', 'user-friendly', or 'optimal'. Use measurable criteria."
          tip="Ask yourself: 'What test would I run to prove this works?' If the answer is 'I don't know', rewrite it."
        />
        <PrincipleCard
          title="Unique Identification"
          description="Always use unique IDs (like REQ-001). This is the foundation of traceability. Never refer to a requirement by its text, as text can change."
        />
      </Section>

      <Section title="Traceability" icon={<Activity size={20} />}>
        <PrincipleCard
          title="Vertical Traceability"
          description="Ensure every high-level requirement is satisfied by at least one low-level requirement or use case. This prevents 'orphan' requirements that are never implemented."
        />
        <PrincipleCard
          title="The 'V-Model' Context"
          description="In Tracyfy, the relationship between Requirements and Test Cases represents the validation leg of the V-model. Without this link, you have no evidence of software quality."
          tip="Use the Traceability Gaps dashboard daily to find unlinked artifacts before they become project risks."
        />
      </Section>

      <Section title="Risk Management" icon={<ShieldCheck size={20} />}>
        <PrincipleCard
          title="Early Mitigation"
          description="Don't just list risks; link them to the requirements that mitigate them. This shows safety and security auditors that you've engineered the system with failures in mind."
        />
        <PrincipleCard
          title="Impact Analysis"
          description="Before changing a high-level requirement, use the link graph to see which test cases and use cases will be affected. This prevents regression errors in complex systems."
        />
      </Section>

      <Section title="Content Reuse & Global Library" icon={<Zap size={20} />}>
        <PrincipleCard
          title="Standardize, Don't Replicate"
          description="Use the Global Library for common requirements like 'Compliance with ISO-26262' or 'Standard Login Behavior'. This ensures consistency across all your engineering projects."
        />
      </Section>

      <footer
        style={{
          marginTop: 'var(--spacing-2xl)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--spacing-lg)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <p>Tracyfy Engineering Guidelines</p>
      </footer>
    </div>
  );
};
