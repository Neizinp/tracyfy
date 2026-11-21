/**
 * The user is the git author of this repository (P5 in docs/DESIGN.md):
 * user.name / user.email in .git/config. Every commit the app makes is
 * authored by them. There is no separate user store.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { Person } from '../../types';
import { repository } from '../../storage/repository';
import { isE2EMode } from '../e2e';

export interface UserSlice {
  /** Null until user.name is set in this repository */
  currentUser: Person | null;
  isUserLoading: boolean;
  /** Read the git author (after a folder is opened) */
  loadUser: () => Promise<void>;
  /** Set user.name / user.email in this repository's .git/config */
  setIdentity: (person: Person) => Promise<void>;
}

const E2E_USER: Person = { name: 'E2E Test User', email: 'e2e@tracyfy.local' };

export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (set) => {
  const e2e = isE2EMode();
  return {
    currentUser: e2e ? E2E_USER : null,
    isUserLoading: !e2e,

    loadUser: async () => {
      if (e2e) return;
      set({ isUserLoading: true });
      try {
        set({ currentUser: await repository.author() });
      } catch (error) {
        console.error('Failed to read the git author:', error);
      } finally {
        set({ isUserLoading: false });
      }
    },

    setIdentity: async (person) => {
      const identity = { name: person.name.trim(), email: person.email.trim() };
      if (!e2e) await repository.setAuthor(identity);
      set({ currentUser: identity });
    },
  };
};
