import React, { useState } from 'react';
import type { Person } from '../types';

interface IdentityFormProps {
  initial?: Person | null;
  submitLabel: string;
  onSubmit: (person: Person) => Promise<void>;
  onCancel?: () => void;
}

/** Name and email of the git author (user.name / user.email of this repository) */
export const IdentityForm: React.FC<IdentityFormProps> = ({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label className="tf-field">
        Name
        <input
          className="tf-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
        />
      </label>
      <label className="tf-field">
        Email
        <input
          className="tf-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>
      {error && (
        <p className="tf-hint" role="alert" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
      <div className="tf-dialog-actions">
        {onCancel && (
          <button type="button" className="tf-button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="tf-button tf-button-primary"
          disabled={!name.trim() || isSubmitting}
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
