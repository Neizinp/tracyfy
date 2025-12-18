import React from 'react';
import { Book, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HubCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}> = ({ title, description, icon, path, color }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(path)}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        padding: 'var(--spacing-xl)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 10px 15px -3px ${color}20, 0 4px 6px -2px ${color}10`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow =
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${color}15`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: '8px' }}>
          {title}
        </h2>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            fontSize: 'var(--font-size-md)',
          }}
        >
          {description}
        </p>
      </div>
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: color,
          fontWeight: 600,
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Explore <ArrowRight size={16} />
      </div>
    </div>
  );
};

export const HelpCenter: React.FC = () => {
  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: 'var(--spacing-2xl) var(--spacing-xl)',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            marginBottom: 'var(--spacing-md)',
            background:
              'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Tracyfy Knowledge Hub
        </h1>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 'var(--spacing-xl)',
        }}
      >
        <HubCard
          title="Tracyfy User Manual"
          description="Learn how to navigate Tracyfy, use keyboard shortcuts, manage artifacts, and master version control."
          icon={<Book size={24} />}
          path="/help/manual"
          color="var(--color-accent)"
        />
        <HubCard
          title="Engineering Guide"
          description="Discover best practices for requirements engineering, risk mitigation, and establishing robust traceability."
          icon={<GraduationCap size={24} />}
          path="/help/guide"
          color="#10b981" // A nice emerald/emerald green for the methodology
        />
      </div>

      <footer
        style={{
          marginTop: 'var(--spacing-2xl)',
          paddingTop: 'var(--spacing-xl)',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <p>Tracyfy Knowledge Hub</p>
      </footer>
    </div>
  );
};
