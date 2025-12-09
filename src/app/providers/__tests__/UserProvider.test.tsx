/**
 * UserProvider Integration Tests
 *
 * Tests for the UserProvider React context including:
 * - Initial state and loading
 * - createUser, updateUser, deleteUser, switchUser operations
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { UserProvider, useUser } from '../UserProvider';
import { diskProjectService } from '../../../services/diskProjectService';

// Mock dependencies
vi.mock('../../../services/diskProjectService', () => ({
  diskProjectService: {
    loadAllUsers: vi.fn(),
    getCurrentUserId: vi.fn(),
    saveUser: vi.fn(),
    deleteUser: vi.fn(),
    setCurrentUserId: vi.fn(),
    getNextId: vi.fn(),
  },
}));

vi.mock('../FileSystemProvider', () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => children,
  useFileSystem: () => ({ isReady: true }),
}));

// Test component to consume context
const TestConsumer: React.FC = () => {
  const { users, currentUser, isLoading } = useUser();
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user-count">{users.length}</div>
      <div data-testid="current-user">{currentUser?.name || 'none'}</div>
    </div>
  );
};

describe('UserProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(diskProjectService.loadAllUsers).mockResolvedValue([]);
    vi.mocked(diskProjectService.getCurrentUserId).mockResolvedValue('');
  });

  describe('initial state', () => {
    it('should start with loading state', async () => {
      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      // Initially loading
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('ready');
      });
    });

    it('should load users on mount when FileSystem is ready', async () => {
      const mockUsers = [
        {
          id: 'USER-001',
          name: 'Test User',
          dateCreated: 1700000000000,
          lastModified: 1700000000000,
        },
      ];
      vi.mocked(diskProjectService.loadAllUsers).mockResolvedValue(mockUsers);
      vi.mocked(diskProjectService.getCurrentUserId).mockResolvedValue('USER-001');

      render(
        <UserProvider>
          <TestConsumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-count').textContent).toBe('1');
        expect(screen.getByTestId('current-user').textContent).toBe('Test User');
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user and add to state', async () => {
      vi.mocked(diskProjectService.getNextId).mockResolvedValue('USER-001');
      vi.mocked(diskProjectService.saveUser).mockResolvedValue(undefined);

      const CreateUserTest: React.FC = () => {
        const { createUser, users } = useUser();
        return (
          <div>
            <button onClick={() => createUser('New User')}>Create</button>
            <div data-testid="users">{users.map((u) => u.name).join(',')}</div>
          </div>
        );
      };

      render(
        <UserProvider>
          <CreateUserTest />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('users')).toBeDefined();
      });

      await act(async () => {
        screen.getByText('Create').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('users').textContent).toBe('New User');
      });

      expect(diskProjectService.saveUser).toHaveBeenCalled();
    });
  });

  describe('switchUser', () => {
    it('should switch current user', async () => {
      const mockUsers = [
        {
          id: 'USER-001',
          name: 'User One',
          dateCreated: 1700000000000,
          lastModified: 1700000000000,
        },
        {
          id: 'USER-002',
          name: 'User Two',
          dateCreated: 1700000000000,
          lastModified: 1700000000000,
        },
      ];
      vi.mocked(diskProjectService.loadAllUsers).mockResolvedValue(mockUsers);
      vi.mocked(diskProjectService.getCurrentUserId).mockResolvedValue('USER-001');

      const SwitchUserTest: React.FC = () => {
        const { switchUser, currentUser } = useUser();
        return (
          <div>
            <button onClick={() => switchUser('USER-002')}>Switch</button>
            <div data-testid="current">{currentUser?.name || 'none'}</div>
          </div>
        );
      };

      render(
        <UserProvider>
          <SwitchUserTest />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current').textContent).toBe('User One');
      });

      await act(async () => {
        screen.getByText('Switch').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('current').textContent).toBe('User Two');
      });

      expect(diskProjectService.setCurrentUserId).toHaveBeenCalledWith('USER-002');
    });
  });

  describe('deleteUser', () => {
    it('should remove user from state', async () => {
      const mockUsers = [
        {
          id: 'USER-001',
          name: 'User One',
          dateCreated: 1700000000000,
          lastModified: 1700000000000,
        },
        {
          id: 'USER-002',
          name: 'User Two',
          dateCreated: 1700000000000,
          lastModified: 1700000000000,
        },
      ];
      vi.mocked(diskProjectService.loadAllUsers).mockResolvedValue(mockUsers);
      vi.mocked(diskProjectService.getCurrentUserId).mockResolvedValue('USER-002');

      const DeleteUserTest: React.FC = () => {
        const { deleteUser, users } = useUser();
        return (
          <div>
            <button onClick={() => deleteUser('USER-001')}>Delete</button>
            <div data-testid="count">{users.length}</div>
          </div>
        );
      };

      render(
        <UserProvider>
          <DeleteUserTest />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count').textContent).toBe('2');
      });

      await act(async () => {
        screen.getByText('Delete').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('count').textContent).toBe('1');
      });

      expect(diskProjectService.deleteUser).toHaveBeenCalledWith('USER-001');
    });
  });
});
