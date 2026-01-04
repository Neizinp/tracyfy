import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSettingsModal } from '../UserSettingsModal';
import type { User } from '../../types';

// Mock the useUser hook
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockSwitchUser = vi.fn();
const mockUpdateUser = vi.fn();

const mockUsers: User[] = [
  { id: 'u1', name: 'Alice', dateCreated: 1000, lastModified: 1000 },
  { id: 'u2', name: 'Bob', dateCreated: 2000, lastModified: 2000 },
];

vi.mock('../../app/providers', () => ({
  useUser: () => ({
    users: mockUsers,
    currentUserId: 'u1',
    currentUser: mockUsers[0],
    createUser: mockCreateUser,
    deleteUser: mockDeleteUser,
    switchUser: mockSwitchUser,
    updateUser: mockUpdateUser,
  }),
  useFileSystem: () => ({
    directoryName: '/test/directory',
    changeDirectory: vi.fn(),
  }),
}));

// Mock keyboard shortcuts hook to avoid issues
vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

describe('UserSettingsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when closed', () => {
    const { container } = render(<UserSettingsModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render user list when open', () => {
    render(<UserSettingsModal {...defaultProps} />);
    expect(screen.getByText('User Settings')).toBeInTheDocument();
    // Alice appears as current user and in the list
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Current User')).toBeInTheDocument();
  });

  it('should allow adding a new user', async () => {
    render(<UserSettingsModal {...defaultProps} />);

    // Click add user button
    fireEvent.click(screen.getByText('+ Add User'));

    // Type name
    const input = screen.getByPlaceholderText('Enter user name...');
    fireEvent.change(input, { target: { value: 'Charlie' } });

    // Click Add
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockCreateUser).toHaveBeenCalledWith('Charlie');
  });

  it('should allow switching users', () => {
    render(<UserSettingsModal {...defaultProps} />);

    // Find switch button for Bob (u2) - Alice is current so she won't have switch button
    const switchButtons = screen.getAllByText('Switch');
    fireEvent.click(switchButtons[0]);

    expect(mockSwitchUser).toHaveBeenCalledWith('u2');
  });

  it('should allow editing a user', async () => {
    render(<UserSettingsModal {...defaultProps} />);

    // Edit Alice
    const editButtons = screen.getAllByTitle('Edit user');
    // First one is likely Alice (u1 comes before u2 in mocks)
    fireEvent.click(editButtons[0]);

    // Input should appear with "Alice"
    const editInput = screen.getByDisplayValue('Alice');
    expect(editInput).toBeInTheDocument();

    fireEvent.change(editInput, { target: { value: 'Alice Revised' } });

    // Save
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'u1',
          name: 'Alice Revised',
        })
      );
    });
  });
  it('should allow deleting a user', async () => {
    render(<UserSettingsModal {...defaultProps} />);

    // Try to delete Bob
    // Find delete button
    const deleteButtons = screen.getAllByTitle('Delete user');
    fireEvent.click(deleteButtons[0]); // Should be one of them. Alice has one? Yes.

    // Confirmation buttons appear: Confirm / Cancel
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(mockDeleteUser).toHaveBeenCalled();
  });

  it('should validate empty input when adding user', () => {
    render(<UserSettingsModal {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add User'));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});
