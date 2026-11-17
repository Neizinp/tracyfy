/**
 * The UI slice: dialogs, the navigation stack between linked artifacts,
 * the link dialog's source, search and table columns.
 */
import { describe, it, expect } from 'vitest';
import { createAppStore } from '..';
import type { SelectedArtifact } from '../../types';

const req: SelectedArtifact = { id: 'REQ-001', type: 'requirement', data: {} };
const tc: SelectedArtifact = { id: 'TC-001', type: 'testCase', data: {} };

describe('ui slice', () => {
  it('starts with no dialog, no selection and an empty search', () => {
    const s = createAppStore().getState();
    expect(s.activeModal).toEqual({ type: null });
    expect(s.selectedArtifact).toBeNull();
    expect(s.navigationStack).toEqual([]);
    expect(s.searchQuery).toBe('');
  });

  it('opens a dialog for an artifact and closes it again', () => {
    const store = createAppStore();
    store.getState().openModal('requirement', true, req);
    expect(store.getState().activeModal).toEqual({ type: 'requirement', isEdit: true });
    expect(store.getState().selectedArtifact).toBe(req);

    store.getState().closeModal();
    expect(store.getState().activeModal).toEqual({ type: null });
    expect(store.getState().selectedArtifact).toBeNull();
  });

  it('opening a dialog without an artifact keeps the selection', () => {
    const store = createAppStore();
    store.getState().setSelectedArtifact(req);
    store.getState().openModal('history');
    expect(store.getState().activeModal).toEqual({ type: 'history', isEdit: false });
    expect(store.getState().selectedArtifact).toBe(req);
  });

  it('going back reopens the artifact the dialog was opened from', () => {
    const store = createAppStore();
    store.getState().pushNavigationStack(req);
    store.getState().openModal('testCase', true, tc);
    expect(store.getState().navigationStack).toHaveLength(1);

    store.getState().popNavigationStack();
    expect(store.getState().navigationStack).toEqual([]);
    expect(store.getState().activeModal).toEqual({ type: 'requirement', isEdit: true });
    expect(store.getState().selectedArtifact).toBe(req);

    // Nothing to go back to: nothing changes
    store.getState().popNavigationStack();
    expect(store.getState().selectedArtifact).toBe(req);
  });

  it('clears the navigation stack', () => {
    const store = createAppStore();
    store.getState().pushNavigationStack(req);
    store.getState().pushNavigationStack(tc);
    store.getState().clearNavigationStack();
    expect(store.getState().navigationStack).toEqual([]);
  });

  it('opens the link dialog from an artifact, or without one', () => {
    const store = createAppStore();
    store.getState().openLinkDialog('REQ-001', 'requirement');
    expect(store.getState().activeModal.type).toBe('link');
    expect(store.getState().linkSourceId).toBe('REQ-001');
    expect(store.getState().linkSourceType).toBe('requirement');

    // A stale source from an earlier dialog must not carry over
    store.getState().openLinkDialog(null);
    expect(store.getState().linkSourceId).toBeNull();
    expect(store.getState().linkSourceType).toBeNull();
  });

  it('remembers table columns per project folder', () => {
    localStorage.clear();
    const store = createAppStore();
    store.setState({ directoryName: 'door-controller' });
    store.getState().setColumnVisible('risk', 'owner', false);
    expect(store.getState().columnVisibility).toEqual({ risk: { owner: false } });

    // Another folder has its own columns; the same folder gets them back
    const other = createAppStore();
    other.setState({ directoryName: 'elevator' });
    expect(other.getState().columnVisibility).toEqual({});
    const again = createAppStore();
    again.setState({ directoryName: 'door-controller' });
    expect(again.getState().columnVisibility).toEqual({ risk: { owner: false } });
    localStorage.clear();
  });

  it('updates the search query', () => {
    const store = createAppStore();
    store.getState().setSearchQuery('login');
    expect(store.getState().searchQuery).toBe('login');
  });

  it('editing an artifact needs a user', () => {
    const store = createAppStore();
    store.getState().editArtifact('requirement', { id: 'REQ-001' });
    expect(store.getState().activeModal.type).toBeNull();
    expect(store.getState().toasts.map((t) => t.message)).toEqual([
      'Set your name in User Settings before editing artifacts.',
    ]);

    store.setState({ currentUser: { name: 'Ada', email: 'ada@example.com' } });
    store.getState().editArtifact('requirement', { id: 'REQ-001' });
    expect(store.getState().activeModal).toEqual({ type: 'requirement', isEdit: true });
    expect(store.getState().selectedArtifact?.id).toBe('REQ-001');
  });
});
