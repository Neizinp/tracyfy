import React from 'react';
import type { Person } from '../types';
import { IdentityForm } from './IdentityForm';

interface UserOnboardingModalProps {
  isOpen: boolean;
  onSubmit: (person: Person) => Promise<void>;
}

/** Shown when this repository has no user.name yet */
export const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({ isOpen, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="tf-dialog-backdrop" style={{ zIndex: 10000 }}>
      <div className="tf-dialog" role="dialog" aria-labelledby="onboarding-title">
        <h2 id="onboarding-title">Welcome to Tracyfy!</h2>
        <p className="tf-hint">
          Who are you? Your name and email are the author of every change you commit. They are
          stored in this repository&apos;s git settings (user.name and user.email), not in the
          project files.
        </p>
        <IdentityForm submitLabel="Get Started" onSubmit={onSubmit} />
      </div>
    </div>
  );
};
