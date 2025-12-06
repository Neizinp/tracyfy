import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GlobalLibraryModal } from '../GlobalLibraryModal';

describe('GlobalLibraryModal', () => {
  it('should render when closed', () => {
    const { container } = render(
      <GlobalLibraryModal
        isOpen={false}
        onClose={vi.fn()}
        projects={[]}
        currentProjectId=""
        globalRequirements={[]}
        globalUseCases={[]}
        globalTestCases={[]}
        globalInformation={[]}
        onAddToProject={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
  });
});
