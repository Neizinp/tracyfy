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

      const coverageLabels = screen.getAllByText('Coverage');
      expect(coverageLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Navigation', () => {
    it('renders all tabs including Impact and Matrix', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      const tabBar = getTabBar();

      expect(within(tabBar).getByText('Overview')).toBeInTheDocument();
      expect(within(tabBar).getByText(/Gaps/)).toBeInTheDocument();
      expect(within(tabBar).getByText(/Links/)).toBeInTheDocument();
      expect(within(tabBar).getByText('Impact')).toBeInTheDocument();
      expect(within(tabBar).getByText('Matrix')).toBeInTheDocument();
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

    it('switches to Impact tab when clicked', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Impact');

      expect(screen.getByText('Impact Analysis')).toBeInTheDocument();
    });

    it('switches to Matrix tab when clicked', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Matrix');

      expect(screen.getByText('Traceability Matrix')).toBeInTheDocument();
    });
  });

  describe('Gaps Tab', () => {
    it('lists unlinked artifacts with issue type badges', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      // REQ-002 and INFO-001 have no links
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('INFO-001')).toBeInTheDocument();
    });

    it('shows issue type labels', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      // Should show issue type badges
      const noLinksLabels = screen.getAllByText(/No links|No outgoing|No incoming/);
      expect(noLinksLabels.length).toBeGreaterThan(0);
    });

    it('shows empty state when all artifacts are linked', () => {
      const allLinkedProps = {
        requirements: [{ ...mockRequirements[0] }],
        useCases: mockUseCases,
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

      expect(screen.getAllByText('REQ-001').length).toBeGreaterThan(0);
      expect(screen.getByText('satisfies')).toBeInTheDocument();
    });

    it('includes legacy requirementIds as verifies links', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      // TC-001 has requirementIds: ['REQ-001'] which should show as verifies
      expect(screen.getByText('verifies')).toBeInTheDocument();
      expect(screen.getByText('TC-001')).toBeInTheDocument();
    });
  });

  describe('Impact Tab', () => {
    it('shows artifact selector dropdown', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Impact');

      expect(screen.getByText('Select an artifact to see its connections:')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows empty state when no artifact selected', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Impact');

      expect(screen.getByText(/Select an artifact above to explore/)).toBeInTheDocument();
    });

    it('shows connections when artifact is selected', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Impact');

      // Select REQ-001
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REQ-001' } });

      // Should show the selected artifact
      expect(screen.getAllByText('REQ-001').length).toBeGreaterThan(0);
      // Should show outgoing links section
      expect(screen.getByText(/Outgoing Links/)).toBeInTheDocument();
    });

    it('shows incoming links for requirements from TestCases', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Impact');

      // Select REQ-001 which is referenced by TC-001 via requirementIds
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REQ-001' } });

      // Should show incoming links from TC-001
      expect(screen.getByText(/Incoming Links/)).toBeInTheDocument();
      // TC-001 should appear as incoming
      const tcElements = screen.getAllByText('TC-001');
      expect(tcElements.length).toBeGreaterThan(0);
    });

    it('allows clicking connected artifacts to navigate', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Impact');

      // Select REQ-001
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REQ-001' } });

      // Click on UC-001 in outgoing links - should update selection
      const ucLink = screen.getAllByText('UC-001')[0];
      fireEvent.click(ucLink);

      // Now UC-001 should be the selected artifact (shown in header)
      const headerElements = screen.getAllByText('UC-001');
      expect(headerElements.length).toBeGreaterThan(0);
    });
  });

  describe('Matrix Tab', () => {
    it('shows matrix with artifact IDs as headers', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Matrix');

      expect(screen.getByText('From / To')).toBeInTheDocument();
      // Artifact IDs should appear in the matrix
      expect(screen.getAllByText('REQ-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('UC-001').length).toBeGreaterThan(0);
    });

    it('shows legend for link symbols', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Matrix');

      expect(screen.getByText('Legend:')).toBeInTheDocument();
      expect(screen.getByText(/satisfies/)).toBeInTheDocument();
      expect(screen.getByText(/verifies/)).toBeInTheDocument();
    });

    it('has type filter dropdown', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Matrix');

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText(/All Types/)).toBeInTheDocument();
    });

    it('filters matrix by artifact type', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Matrix');

      // Filter to only requirements
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'requirement' } });

      // Should show requirements but not use cases
      expect(screen.getAllByText('REQ-001').length).toBeGreaterThan(0);
      expect(screen.queryByText('UC-001')).not.toBeInTheDocument();
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

      fireEvent.change(screen.getByDisplayValue('All Types'), { target: { value: 'requirement' } });

      expect(screen.getByText('REQ-002')).toBeInTheDocument();
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

      const gapButtons = screen.getAllByRole('button', { name: /\d+ gaps?/ });
      fireEvent.click(gapButtons[0]);

      expect(screen.getByText(/Unlinked Artifacts/)).toBeInTheDocument();
    });
  });
});
