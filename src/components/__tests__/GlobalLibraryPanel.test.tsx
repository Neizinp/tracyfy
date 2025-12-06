import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlobalLibraryPanel } from '../GlobalLibraryPanel';

describe('GlobalLibraryPanel', () => {
  it('should render when closed', () => {
    const { container } = render(
      <GlobalLibraryPanel
        isOpen={false}
        onClose={() => {}}
        requirements={[]}
        useCases={[]}
        testCases={[]}
        information={[]}
        projects={[]}
        selectedItems={new Set()}
        onToggleSelect={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });
});
