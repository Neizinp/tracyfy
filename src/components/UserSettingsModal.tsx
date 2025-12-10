import React, { useState, useEffect } from 'react';
import { useUser } from '../app/providers';
import type { User } from '../types';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUserId, currentUser, createUser, deleteUser, switchUser, updateUser } =
    useUser();

  const [newUserName, setNewUserName] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewUserName('');
      setEditingUser(null);
      setShowDeleteConfirm(null);
      setIsAdding(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    await createUser(newUserName.trim());
    setNewUserName('');
    setIsAdding(false);
  };

  const handleSwitchUser = async (userId: string) => {
    await switchUser(userId);
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    setShowDeleteConfirm(null);
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
  };

  const handleSaveEdit = async () => {
    if (editingUser && editName.trim()) {
      await updateUser({ ...editingUser, name: editName.trim() });
      setEditingUser(null);
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
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#222',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '500px',
          maxWidth: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontWeight: 600 }}>User Settings</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto', flex: 1 }}>
          {/* Current User Display */}
          {currentUser && (
            <div
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-accent)',
                borderRadius: '8px',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-accent)',
                  marginBottom: '4px',
                }}
              >
                Current User
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                {currentUser.name}
              </div>
            </div>
          )}

          {/* User List */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>All Users</h4>
              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                  }}
                >
                  + Add User
                </button>
              )}
            </div>

            {/* Add User Form */}
            {isAdding && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-sm)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <input
                  type="text"
                  placeholder="Enter user name..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddUser}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewUserName('');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Users List */}
            {users.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-lg)',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No users yet. Add your first user above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                {users.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      backgroundColor:
                        user.id === currentUserId
                          ? 'rgba(var(--color-accent-rgb), 0.1)'
                          : 'var(--color-bg-card)',
                      border:
                        user.id === currentUserId
                          ? '1px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                      borderRadius: '6px',
                    }}
                  >
                    {editingUser?.id === user.id ? (
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flex: 1 }}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          autoFocus
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-app)',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleSaveEdit}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span style={{ fontWeight: user.id === currentUserId ? 600 : 400 }}>
                            {user.name}
                          </span>
                          <span
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-muted)',
                              marginLeft: '8px',
                            }}
                          >
                            {user.id}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                          {user.id !== currentUserId && (
                            <button
                              onClick={() => handleSwitchUser(user.id)}
                              title="Switch to this user"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: 'var(--font-size-xs)',
                              }}
                            >
                              Switch
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEdit(user)}
                            title="Edit user"
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'transparent',
                              color: 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              fontSize: 'var(--font-size-xs)',
                            }}
                          >
                            Edit
                          </button>
                          {showDeleteConfirm === user.id ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: 'var(--color-error)',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: 'var(--font-size-xs)',
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                  backgroundColor: 'transparent',
                                  color: 'var(--color-text-muted)',
                                  cursor: 'pointer',
                                  fontSize: 'var(--font-size-xs)',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(user.id)}
                              title="Delete user"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--color-error-light)',
                                backgroundColor: 'var(--color-bg-card)',
                                color: 'var(--color-error)',
                                cursor: 'pointer',
                                fontSize: 'var(--font-size-xs)',
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
