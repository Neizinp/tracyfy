import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TraceabilityDashboard } from '../TraceabilityDashboard';
import type { Requirement, UseCase, TestCase, Information } from '../../types';

describe('TraceabilityDashboard', () => {
  const mockRequirements: Requirement[] = [
    {
      id: 'REQ-001',
      title: 'Parent Req',
      description: '',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),
      text: '',
      rationale: '',
      linkedArtifacts: [{ targetId: 'UC-001', type: 'satisfies' }],
    },
    {
      id: 'REQ-002',
      title: 'Unlinked Req',
      description: '',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),
      text: '',
      rationale: '',
      // No linked artifacts - this is a gap
    },
  ];

  const mockUseCases: UseCase[] = [
    {
      id: 'UC-001',
      title: 'Test Use Case',
      description: '',
      actor: 'User',
      preconditions: '',
      postconditions: '',
      mainFlow: '',
      priority: 'medium',
      status: 'draft',
      revision: '01',
      lastModified: Date.now(),
      linkedArtifacts: [{ targetId: 'REQ-001', type: 'derived_from' }],
    },
  ];

  const mockTestCases: TestCase[] = [
    {
      id: 'TC-001',
      title: 'Test Case',
      description: '',
      requirementIds: ['REQ-001'],
      status: 'draft',
      priority: 'medium',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
      // No linked artifacts - this is a gap
    },
  ];

  const mockInformation: Information[] = [
    {
      id: 'INFO-001',
      title: 'Test Info',
      content: '',
      type: 'note',
      revision: '01',
      dateCreated: Date.now(),
      lastModified: Date.now(),
      // No linked artifacts - this is a gap
    },
  ];

  const defaultProps = {
    requirements: mockRequirements,
    useCases: mockUseCases,
    testCases: mockTestCases,
    information: mockInformation,
  };

  // Helper to get the tab bar
  const getTabBar = () => {
    return screen.getByRole('button', { name: 'Overview' }).parentElement!;
  };

  const clickTab = (tabName: string) => {
    const tabBar = getTabBar();
    const tab = within(tabBar).getByText(new RegExp(tabName));
    fireEvent.click(tab);
  };

  describe('Overview Tab', () => {
    it('renders summary cards for all artifact types', () => {
      render(<TraceabilityDashboard {...defaultProps} />);

      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(screen.getByText('Use Cases')).toBeInTheDocument();
      expect(screen.getByText('Test Cases')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
    });

    it('shows total artifact counts', () => {
      render(<TraceabilityDashboard {...defaultProps} />);

      expect(screen.getByText('Total Artifacts')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // 2 reqs + 1 UC + 1 TC + 1 Info
    });

    it('displays coverage percentages', () => {
      render(<TraceabilityDashboard {...defaultProps} />);

      // Coverage percentages should be visible
      const coverageLabels = screen.getAllByText('Coverage');
      expect(coverageLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Navigation', () => {
    it('renders all tabs', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      const tabBar = getTabBar();

      expect(within(tabBar).getByText('Overview')).toBeInTheDocument();
      expect(within(tabBar).getByText(/Gaps/)).toBeInTheDocument();
      expect(within(tabBar).getByText(/Links/)).toBeInTheDocument();
    });

    it('switches to Gaps tab when clicked', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      expect(screen.getByText(/Unlinked Artifacts/)).toBeInTheDocument();
    });

    it('switches to Links tab when clicked', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      expect(screen.getByText(/All Links/)).toBeInTheDocument();
    });
  });

  describe('Gaps Tab', () => {
    it('lists unlinked artifacts', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      // REQ-002, TC-001, INFO-001 have no links
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('TC-001')).toBeInTheDocument();
      expect(screen.getByText('INFO-001')).toBeInTheDocument();
    });

    it('shows empty state when all artifacts are linked', () => {
      const allLinkedProps = {
        requirements: [{ ...mockRequirements[0] }], // REQ-001 has link
        useCases: mockUseCases, // UC-001 has link
        testCases: [],
        information: [],
      };

      render(<TraceabilityDashboard {...allLinkedProps} />);
      clickTab('Gaps');

      expect(screen.getByText('All artifacts are linked!')).toBeInTheDocument();
    });
  });

  describe('Links Tab', () => {
    it('displays links table with source and target', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Link Type')).toBeInTheDocument();
      expect(screen.getByText('Target')).toBeInTheDocument();
    });

    it('shows link relationships', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      // REQ-001 satisfies UC-001
      expect(screen.getAllByText('REQ-001').length).toBeGreaterThan(0);
      expect(screen.getByText('satisfies')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('shows type filter dropdown on Gaps tab', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    });

    it('filters gaps by type', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      // Select Requirements filter
      fireEvent.change(screen.getByDisplayValue('All Types'), { target: { value: 'requirement' } });

      // Only REQ-002 should be visible
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.queryByText('TC-001')).not.toBeInTheDocument();
      expect(screen.queryByText('INFO-001')).not.toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('calls onSelectArtifact when gap item is clicked', () => {
      const mockOnSelect = vi.fn();
      render(<TraceabilityDashboard {...defaultProps} onSelectArtifact={mockOnSelect} />);
      clickTab('Gaps');

      fireEvent.click(screen.getByText('REQ-002'));

      expect(mockOnSelect).toHaveBeenCalledWith('REQ-002');
    });

    it('navigates to Gaps tab when clicking gaps count in summary card', () => {
      render(<TraceabilityDashboard {...defaultProps} />);

      // Click on a gaps count button (found outside the tab bar)
      const gapButtons = screen.getAllByRole('button', { name: /\d+ gaps?/ });
      fireEvent.click(gapButtons[0]);

      // Should switch to Gaps tab
      expect(screen.getByText(/Unlinked Artifacts/)).toBeInTheDocument();
    });
  });
});
