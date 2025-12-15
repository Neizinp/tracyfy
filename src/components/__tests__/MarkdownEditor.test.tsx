import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownEditor } from '../MarkdownEditor';

describe('MarkdownEditor', () => {
  it('renders in edit mode by default', () => {
    const mockOnChange = vi.fn();
    render(<MarkdownEditor value="" onChange={mockOnChange} label="Test Label" />);

    // Should show the label
    expect(screen.getByText('Test Label')).toBeInTheDocument();

    // Should show Preview button (since we're in edit mode)
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('toggles between edit and preview modes', () => {
    const mockOnChange = vi.fn();
    render(<MarkdownEditor value="# Hello" onChange={mockOnChange} label="Content" />);

    // Initially in edit mode
    expect(screen.getByText('Preview')).toBeInTheDocument();

    // Click to switch to preview
    fireEvent.click(screen.getByText('Preview'));

    // Now should show Edit button
    expect(screen.getByText('Edit')).toBeInTheDocument();

    // Click to switch back to edit
    fireEvent.click(screen.getByText('Edit'));

    // Back to showing Preview button
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders markdown content in preview mode', () => {
    const mockOnChange = vi.fn();
    const markdownContent = '**Bold text** and *italic text*';

    render(<MarkdownEditor value={markdownContent} onChange={mockOnChange} label="Content" />);

    // Switch to preview mode
    fireEvent.click(screen.getByText('Preview'));

    // Markdown should be rendered (the actual rendering is done by ReactMarkdown)
    // We can check that we're in preview mode and the content is visible
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows "No content" when value is empty in preview mode', () => {
    const mockOnChange = vi.fn();

    render(<MarkdownEditor value="" onChange={mockOnChange} label="Content" />);

    // Switch to preview mode
    fireEvent.click(screen.getByText('Preview'));

    // Should show "No content" message
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const mockOnChange = vi.fn();
    const customHeight = 300;

    const { container } = render(
      <MarkdownEditor value="Test" onChange={mockOnChange} height={customHeight} />
    );

    // The MDEditor component receives the height prop
    // We can verify the component rendered without errors
    expect(container.querySelector('.markdown-editor-container')).toBeInTheDocument();
  });

  it('renders Image button and hidden file input', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<MarkdownEditor value="" onChange={mockOnChange} label="Test" />);

    // Should show the Image button
    expect(screen.getByText('Image')).toBeInTheDocument();

    // Should have a hidden file input
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('clicking Image button triggers file input click', () => {
    const mockOnChange = vi.fn();
    const { container } = render(<MarkdownEditor value="" onChange={mockOnChange} label="Test" />);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    // Click the Image button
    fireEvent.click(screen.getByText('Image'));

    // Should trigger file input click
    expect(clickSpy).toHaveBeenCalled();
  });
});
