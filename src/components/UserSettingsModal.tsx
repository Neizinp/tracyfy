import React from 'react';
import { X } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { IdentityForm } from './IdentityForm';
import { useAppStore } from '../state';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Who you are (the git author of this repository) and which folder is open */
export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useAppStore((s) => s.currentUser);
  const setIdentity = useAppStore((s) => s.setIdentity);
  const directoryName = useAppStore((s) => s.directoryName);
  const changeDirectory = useAppStore((s) => s.closeFolder);

  useKeyboardShortcuts({ onClose });

  if (!isOpen) return null;

  const handleChangeDirectory = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to change the working directory?\n\n' +
        'This will close the current project and prompt you to select a new folder.'
    );
    if (confirmed) {
      await changeDirectory();
      onClose();
    }
  };

  return (
    <div className="tf-dialog-backdrop">
      <div className="tf-dialog" role="dialog" aria-labelledby="user-settings-title">
        <div className="tf-dialog-header">
          <h2 id="user-settings-title">User Settings</h2>
          <button type="button" className="tf-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <h3>You</h3>
        <p className="tf-hint">
          The author of every change you commit: user.name and user.email in this repository&apos;s
          git settings.
        </p>
        <IdentityForm
          key={`${currentUser?.name}|${currentUser?.email}`}
          initial={currentUser}
          submitLabel="Save"
          onSubmit={setIdentity}
        />

        <h3>Working Directory</h3>
        <p className="tf-mono" style={{ wordBreak: 'break-all' }}>
          {directoryName || 'No directory selected'}
        </p>
        <p className="tf-hint">
          Changing the directory switches to a different project folder. Commit any pending changes
          first.
        </p>
        <button type="button" className="tf-button" onClick={handleChangeDirectory}>
          Change Directory
        </button>
      </div>
    </div>
  );
};
