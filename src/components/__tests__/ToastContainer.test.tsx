/**
 * Toasts must render readable on top of the app: an opaque background and no
 * transparency. Replaces toastOpacitySafeguard.test.ts, which grepped source.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../../app/providers/ToastProvider';
import { ToastContainer } from '../ToastContainer';

/** True if a CSS color is fully opaque (#rgb/#rrggbb, rgb(), or rgba(..., 1)) */
function isOpaqueColor(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (!c || c === 'transparent' || c.startsWith('var(')) return false;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(c)) return true;
  const rgba = c.match(/^rgba?\(([^)]+)\)$/);
  if (!rgba) return false;
  const parts = rgba[1].split(',').map((p) => p.trim());
  return parts.length === 3 || Number(parts[3]) === 1;
}

describe('ToastContainer', () => {
  it.each(['info', 'success', 'warning', 'error'] as const)(
    '%s toasts are visible with an opaque background',
    (type) => {
      const Trigger = () => {
        const { showToast } = useToast();
        return <button onClick={() => showToast(`A ${type} message`, type, 0)}>show</button>;
      };
      render(
        <ToastProvider>
          <Trigger />
          <ToastContainer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'show' }));

      const message = screen.getByText(`A ${type} message`);
      // Walk up to the element that paints the toast background
      let el: HTMLElement | null = message;
      while (el && !el.style.backgroundColor) el = el.parentElement;
      expect(el, 'toast has a background').not.toBeNull();
      expect(isOpaqueColor(el!.style.backgroundColor)).toBe(true);
      expect(el!.style.opacity === '' || Number(el!.style.opacity) === 1).toBe(true);
    }
  );
});
