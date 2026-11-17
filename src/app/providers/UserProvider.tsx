/**
 * The user is the git author of this repository (P5 in docs/DESIGN.md):
 * user.name / user.email in .git/config. Every commit the app makes is
 * authored by them. There is no separate user store.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Person } from '../../types';
import { repository } from '../../storage/repository';
import { useFileSystem } from './FileSystemProvider';

interface UserContextValue {
  /** Null until user.name is set in this repository */
  currentUser: Person | null;
  /** The user and everyone who authored a commit in this repository */
  people: Person[];
  isLoading: boolean;
  /** Set user.name / user.email in this repository's .git/config */
  setIdentity: (person: Person) => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const isE2EMode = () =>
  typeof window !== 'undefined' &&
  !!(window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;

const E2E_USER: Person = { name: 'E2E Test User', email: 'e2e@tracyfy.local' };

/** Commits made before user.name was set carry this placeholder author */
const PLACEHOLDER_AUTHOR = 'Tracyfy User';

function uniqueByName(people: Person[]): Person[] {
  const seen = new Map<string, Person>();
  for (const p of people) if (p.name && !seen.has(p.name)) seen.set(p.name, p);
  return [...seen.values()];
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isReady, directoryName } = useFileSystem();
  const [currentUser, setCurrentUser] = useState<Person | null>(null);
  const [authors, setAuthors] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isReady) {
      setCurrentUser(null);
      setAuthors([]);
      setIsLoading(true);
      return;
    }
    if (isE2EMode()) {
      setCurrentUser(E2E_USER);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [me, history] = await Promise.all([
          repository.author(),
          repository.commits(500).catch(() => []),
        ]);
        if (cancelled) return;
        setCurrentUser(me);
        setAuthors(
          history
            .filter((c) => c.author && c.author !== PLACEHOLDER_AUTHOR)
            .map((c) => ({ name: c.author, email: c.authorEmail ?? '' }))
        );
      } catch (error) {
        console.error('Failed to read the git author:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, directoryName]);

  const setIdentity = useCallback(async (person: Person) => {
    const identity = { name: person.name.trim(), email: person.email.trim() };
    if (!isE2EMode()) await repository.setAuthor(identity);
    setCurrentUser(identity);
  }, []);

  const people = useMemo(
    () => uniqueByName([...(currentUser ? [currentUser] : []), ...authors]),
    [currentUser, authors]
  );

  const value = useMemo(
    () => ({ currentUser, people, isLoading, setIdentity }),
    [currentUser, people, isLoading, setIdentity]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
