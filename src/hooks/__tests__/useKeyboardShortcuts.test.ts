import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add keydown event listener on mount', () => {
    renderHook(() => useKeyboardShortcuts({}));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should remove keydown event listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({}));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should call onSave when Ctrl+S is pressed', () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));

    // Simulate Ctrl+S keydown
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    window.dispatchEvent(event);

    expect(onSave).toHaveBeenCalled();
  });

  it('should call onSave when Cmd+S is pressed', () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));

    // Simulate Cmd+S keydown (macOS)
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
    });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    window.dispatchEvent(event);

    expect(onSave).toHaveBeenCalled();
  });

  it('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onClose }));

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    window.dispatchEvent(event);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onSearch when Ctrl+K is pressed', () => {
    const onSearch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSearch }));

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });
    Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
    window.dispatchEvent(event);

    expect(onSearch).toHaveBeenCalled();
  });

  it('should not call handler if not provided', () => {
    const onSave = vi.fn();
    // Only provide onSave, not onClose
    renderHook(() => useKeyboardShortcuts({ onSave }));

    // Trigger Escape - should not throw or call onSave
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should prevent default when preventDefault is true', () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave, preventDefault: true }));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    const preventDefaultMock = vi.fn();
    Object.defineProperty(event, 'preventDefault', { value: preventDefaultMock });
    window.dispatchEvent(event);

    expect(preventDefaultMock).toHaveBeenCalled();
  });
});
