import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../../types';
import { diskProjectService } from '../../services/diskProjectService';
import { userService } from '../../services/artifactServices';
import { idService } from '../../services/idService';
import { useFileSystem } from './FileSystemProvider';

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

  const { isReady } = useFileSystem();

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  const createUser = useCallback(
    async (name: string): Promise<User> => {
      const id = await idService.getNextId('users');
      const now = Date.now();
      const newUser: User = {
        id,
        name,
        dateCreated: now,
        lastModified: now,
      };

      await userService.save(newUser);
      setUsers((prev) => [...prev, newUser]);

      // If no current user, set this as current
      if (!currentUserId) {
        await diskProjectService.setCurrentUserId(id);
        setCurrentUserId(id);
      }

      return newUser;
    },
    [currentUserId]
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

  // Load users when FileSystem is ready
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const isE2E =
          typeof window !== 'undefined' &&
          (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;

        let loadedUsers = await userService.loadAll();

        if (isE2E && loadedUsers.length === 0) {
          console.log('[UserProvider] E2E mode: creating default test user');
          const testUser = await createUser('E2E Test User');
          loadedUsers = [testUser];
        }

        const storedCurrentUserId = await diskProjectService.getCurrentUserId();
        setUsers(loadedUsers);
        setCurrentUserId(storedCurrentUserId || (isE2E ? loadedUsers[0].id : ''));
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [isReady, createUser]);

  const value: UserContextValue = {
    users,
    currentUserId,
    currentUser,
    isLoading,
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
