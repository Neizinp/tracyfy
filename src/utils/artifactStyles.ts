// Shared styling utilities for consistent artifact display

export interface BadgeStyle {
  bg: string;
  text: string;
}

export const getPriorityStyle = (priority: string): BadgeStyle => {
  switch (priority) {
    case 'high':
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
    case 'medium':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'low':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    default:
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
  }
};

export const getStatusStyle = (status: string): BadgeStyle => {
  switch (status) {
    // Success states
    case 'verified':
    case 'passed':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    // Error states
    case 'failed':
    case 'rejected':
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
    // Warning states
    case 'blocked':
    case 'pending':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    // Info states
    case 'implemented':
    case 'approved':
      return { bg: 'var(--color-info-bg)', text: 'var(--color-info-light)' };
    // Default/draft
    case 'draft':
    case 'not_run':
    default:
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
  }
};

// Common badge/pill styles
export const badgeStyle = {
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: 'var(--font-size-xs)',
  textTransform: 'capitalize' as const,
  fontWeight: 500,
};

// Common ID badge style
export const idBadgeStyle = {
  fontFamily: 'monospace',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-accent-light)',
  backgroundColor: 'var(--color-bg-secondary)',
  padding: '2px 6px',
  borderRadius: '4px',
};

// Revision badge style
export const revisionBadgeStyle = {
  fontSize: 'var(--font-size-xs)',
  padding: '1px 5px',
  borderRadius: '3px',
  backgroundColor: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
};
