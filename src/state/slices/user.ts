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
  /** The user and everyone who authored a commit in this repository */
  people: Person[];
  isUserLoading: boolean;
  /** Read the author and the people in the history (after a folder is opened) */
  loadUser: () => Promise<void>;
  /** Set user.name / user.email in this repository's .git/config */
  setIdentity: (person: Person) => Promise<void>;
}

const E2E_USER: Person = { name: 'E2E Test User', email: 'e2e@tracyfy.local' };

/** Commits made before user.name was set carry this placeholder author */
const PLACEHOLDER_AUTHOR = 'Tracyfy User';

function peopleOf(me: Person | null, authors: Person[]): Person[] {
  const seen = new Map<string, Person>();
  for (const p of [...(me ? [me] : []), ...authors]) {
    if (p.name && !seen.has(p.name)) seen.set(p.name, p);
  }
  return [...seen.values()];
}

export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (set) => {
  const e2e = isE2EMode();
  // Everyone who authored a commit, as read by the last loadUser
  let authors: Person[] = [];
  return {
    currentUser: e2e ? E2E_USER : null,
    people: e2e ? [E2E_USER] : [],
    isUserLoading: !e2e,

    loadUser: async () => {
      if (e2e) return;
      set({ isUserLoading: true });
      try {
        const [me, history] = await Promise.all([
          repository.author(),
          repository.commits(500).catch(() => []),
        ]);
        authors = history
          .filter((c) => c.author && c.author !== PLACEHOLDER_AUTHOR)
          .map((c) => ({ name: c.author, email: c.authorEmail ?? '' }));
        set({ currentUser: me, people: peopleOf(me, authors) });
      } catch (error) {
        console.error('Failed to read the git author:', error);
      } finally {
        set({ isUserLoading: false });
      }
    },

    setIdentity: async (person) => {
      const identity = { name: person.name.trim(), email: person.email.trim() };
      if (!e2e) await repository.setAuthor(identity);
      set({ currentUser: identity, people: peopleOf(identity, authors) });
    },
  };
};
