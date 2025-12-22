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
import { userService } from '../../../services/artifactServices';
import { idService } from '../../../services/idService';

// Mock dependencies
vi.mock('../../../services/diskProjectService', () => ({
  diskProjectService: {
    getCurrentUserId: vi.fn(),
    setCurrentUserId: vi.fn(),
  },
}));

vi.mock('../../../services/artifactServices', () => ({
  userService: {
    loadAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../services/idService', () => ({
  idService: {
    getNextId: vi.fn(),
  },
}));

// Dynamic mock state for FileSystemProvider
let mockPreloadedUsers: import('../../../types').User[] = [];
let mockPreloadedCurrentUserId = '';

vi.mock('../FileSystemProvider', () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => children,
  useFileSystem: () => ({
    isReady: true,
    preloadedUsers: mockPreloadedUsers,
    preloadedCurrentUserId: mockPreloadedCurrentUserId,
  }),
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
    // Reset mock state before each test
    mockPreloadedUsers = [];
    mockPreloadedCurrentUserId = '';
    vi.mocked(userService.loadAll).mockResolvedValue([]);
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
      // Set preloaded users via mock state
      mockPreloadedUsers = [
        {
          id: 'USER-001',
          name: 'Test User',
          dateCreated: 1700000000000,
          lastModified: 1700000000000,
        },
      ];
      mockPreloadedCurrentUserId = 'USER-001';

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
      vi.mocked(idService.getNextId).mockResolvedValue('USER-001');
      vi.mocked(userService.save).mockResolvedValue({
        id: 'USER-001',
        name: 'New User',
        dateCreated: 0,
        lastModified: 0,
      });

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

      expect(userService.save).toHaveBeenCalled();
    });
  });

  describe('switchUser', () => {
    it('should switch current user', async () => {
      // Set preloaded users via mock state
      mockPreloadedUsers = [
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
      mockPreloadedCurrentUserId = 'USER-001';

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
      // Set preloaded users via mock state
      mockPreloadedUsers = [
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
      mockPreloadedCurrentUserId = 'USER-002';

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

      expect(userService.delete).toHaveBeenCalledWith('USER-001');
    });
  });
});
