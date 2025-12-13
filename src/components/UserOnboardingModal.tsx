import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

interface UserOnboardingModalProps {
  isOpen: boolean;
  onCreateUser: (name: string) => Promise<void>;
}

export const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({
  isOpen,
  onCreateUser,
}) => {
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateUser(userName.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #2a2a2a)',
          borderRadius: '12px',
          padding: '32px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <UserPlus size={32} color="white" />
        </div>

        <h2
          style={{
            margin: '0 0 8px',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          Welcome to Tracyfy!
        </h2>

        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Let's start by creating your user profile. This name will be used to track who makes
          changes to artifacts.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-app)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-base)',
              outline: 'none',
              marginBottom: '16px',
            }}
          />

          <button
            type="submit"
            disabled={!userName.trim() || isSubmitting}
            style={{
              width: '100%',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: userName.trim()
                ? 'var(--color-accent, #6366f1)'
                : 'var(--color-bg-secondary)',
              color: userName.trim() ? 'white' : 'var(--color-text-muted)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 500,
              cursor: userName.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
};
