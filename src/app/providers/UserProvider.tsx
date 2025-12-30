import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../types';
import { diskProjectService } from '../../services/diskProjectService';
import { userService } from '../../services/artifactServices';
import { idService } from '../../services/idService';
import { useFileSystem } from './FileSystemProvider';
import { debug } from '../../utils/debug';

interface UserContextValue {
  // State
  users: User[];
  currentUserId: string;
  currentUser: User | null;
  isLoading: boolean;

  // Handlers
  createUser: (name: string) => Promise<User>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const { isReady, preloadedUsers, preloadedCurrentUserId } = useFileSystem();

  const createUser = useCallback(
    async (name: string): Promise<User> => {
      const isE2E =
        typeof window !== 'undefined' &&
        (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;

      let id: string;
      if (isE2E) {
        // In E2E mode, generate ID without disk access
        const counter = users.length + 1;
        id = `USR-${String(counter).padStart(3, '0')}`;
      } else {
        id = await idService.getNextId('users');
      }

      const now = Date.now();
      const newUser: User = {
        id,
        name,
        dateCreated: now,
        lastModified: now,
      };

      if (!isE2E) {
        await userService.save(newUser);
      }
      setUsers((prev) => [...prev, newUser]);

      // If no current user, set this as current
      setCurrentUserId((prev) => {
        if (!prev) {
          if (!isE2E) {
            diskProjectService.setCurrentUserId(id);
          }
          return id;
        }
        return prev;
      });

      return newUser;
    },
    [users.length]
  );

  const updateUser = useCallback(async (user: User): Promise<void> => {
    const updatedUser = { ...user, lastModified: Date.now() };
    await userService.save(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
  }, []);

  const deleteUser = useCallback(
    async (userId: string): Promise<void> => {
      await userService.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));

      // If deleted user was current, switch to another user
      if (currentUserId === userId) {
        const remainingUsers = users.filter((u) => u.id !== userId);
        if (remainingUsers.length > 0) {
          await diskProjectService.setCurrentUserId(remainingUsers[0].id);
          setCurrentUserId(remainingUsers[0].id);
        } else {
          await diskProjectService.setCurrentUserId('');
          setCurrentUserId('');
        }
      }
    },
    [currentUserId, users]
  );

  const switchUser = useCallback(async (userId: string): Promise<void> => {
    await diskProjectService.setCurrentUserId(userId);
    setCurrentUserId(userId);
  }, []);

  // Load users when FileSystem is ready - use preloaded data from FileSystemProvider
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const initUsers = async () => {
      setIsLoading(true);
      try {
        const isE2E =
          typeof window !== 'undefined' &&
          (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;

        // Use preloaded user data from FileSystemProvider (no disk read needed!)
        let loadedUsers = preloadedUsers;

        if (isE2E && loadedUsers.length === 0) {
          debug.log('[UserProvider] E2E mode: creating default test user');
          const testUser = await createUser('E2E Test User');
          loadedUsers = [testUser];
        }

        setUsers(loadedUsers);
        setCurrentUserId(
          preloadedCurrentUserId || (isE2E && loadedUsers.length > 0 ? loadedUsers[0].id : '')
        );
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, preloadedUsers, preloadedCurrentUserId]); // createUser intentionally excluded to prevent infinite loop

  // Use preloaded data directly when local state hasn't been set yet
  // This ensures users show IMMEDIATELY without waiting for the effect
  const effectiveUsers = users.length > 0 ? users : preloadedUsers;
  const effectiveCurrentUserId = currentUserId || preloadedCurrentUserId;
  const effectiveCurrentUser = effectiveUsers.find((u) => u.id === effectiveCurrentUserId) || null;

  const value: UserContextValue = {
    users: effectiveUsers,
    currentUserId: effectiveCurrentUserId,
    currentUser: effectiveCurrentUser,
    isLoading: isLoading && preloadedUsers.length === 0, // Not loading if we have preloaded data
    createUser,
    updateUser,
    deleteUser,
    switchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
