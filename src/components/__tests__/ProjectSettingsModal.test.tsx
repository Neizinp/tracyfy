import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSettingsModal } from '../ProjectSettingsModal';

describe('ProjectSettingsModal', () => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  const props = {
    project: { name: 'Door Controller', description: 'Lobby doors' },
    lifecycle: { reviewOnContentChange: true },
    isOpen: true,
    onClose,
    onSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    onSave.mockResolvedValue(undefined);
  });

  it('shows the current name and description', () => {
    render(<ProjectSettingsModal {...props} />);
    expect(screen.getByRole('textbox', { name: /project name/i })).toHaveValue('Door Controller');
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Lobby doors');
  });

  it('renders nothing when closed', () => {
    render(<ProjectSettingsModal {...props} isOpen={false} />);
    expect(screen.queryByText('Project Settings')).not.toBeInTheDocument();
  });

  it('saves the edited values and closes', async () => {
    render(<ProjectSettingsModal {...props} />);
    fireEvent.change(screen.getByRole('textbox', { name: /project name/i }), {
      target: { value: 'Gate Controller' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        name: 'Gate Controller',
        description: 'Lobby doors',
        reviewOnContentChange: true,
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('cannot be saved without a name', () => {
    render(<ProjectSettingsModal {...props} />);
    fireEvent.change(screen.getByRole('textbox', { name: /project name/i }), {
      target: { value: '  ' },
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows why saving failed and stays open', async () => {
    onSave.mockRejectedValue(new Error('The project needs a name'));
    render(<ProjectSettingsModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The project needs a name');
    expect(onClose).not.toHaveBeenCalled();
  });
});
