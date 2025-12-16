import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { TraceabilityDashboard } from '../TraceabilityDashboard';
import type { Requirement, UseCase, TestCase, Information, Link } from '../../types';
import { diskLinkService } from '../../services/diskLinkService';

// Mock the diskLinkService for LinksView
vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getAllLinks: vi.fn(),
    deleteLink: vi.fn(),
    updateLink: vi.fn(),
  },
}));

// Default mock setup - reset before each test
beforeEach(() => {
  vi.clearAllMocks();
  // Default to empty array for tests that don't care about links
  vi.mocked(diskLinkService.getAllLinks).mockResolvedValue([]);
});

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

    it('switches to Links tab when clicked', async () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      // LinksView shows header like "Links (N)"
      await waitFor(() => {
        expect(screen.queryByText('Loading links...')).not.toBeInTheDocument();
      });
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
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
    // Create mock links that match what the component would derive
    const mockLinks: Link[] = [
      {
        id: 'LINK-001',
        sourceId: 'REQ-001',
        targetId: 'UC-001',
        type: 'satisfies',
        projectIds: [],
        dateCreated: Date.now(),
        lastModified: Date.now(),
      },
      {
        id: 'LINK-002',
        sourceId: 'TC-001',
        targetId: 'REQ-001',
        type: 'verifies',
        projectIds: [],
        dateCreated: Date.now(),
        lastModified: Date.now(),
      },
    ];

    beforeEach(() => {
      vi.mocked(diskLinkService.getAllLinks).mockResolvedValue(mockLinks);
    });

    it('displays LinksView with table headers', async () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      await waitFor(() => {
        expect(screen.queryByText('Loading links...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Target')).toBeInTheDocument();
    });

    it('shows links from diskLinkService', async () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      await waitFor(() => {
        expect(screen.queryByText('Loading links...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('LINK-001')).toBeInTheDocument();
      expect(screen.getByText('LINK-002')).toBeInTheDocument();
    });

    it('displays link types in the table', async () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Links');

      await waitFor(() => {
        expect(screen.queryByText('Loading links...')).not.toBeInTheDocument();
      });

      // Use getAllByText since link types appear in both the dropdown and the table
      expect(screen.getAllByText('Satisfies').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Verifies').length).toBeGreaterThan(0);
    });
  });

  describe('Impact Tab', () => {
    // Mock standalone links for impact analysis
    const mockStandaloneLinks: Link[] = [
      {
        id: 'LINK-001',
        sourceId: 'REQ-001',
        targetId: 'UC-001',
        type: 'satisfies',
        projectIds: [],
        dateCreated: Date.now(),
        lastModified: Date.now(),
      },
      {
        id: 'LINK-002',
        sourceId: 'TC-001',
        targetId: 'REQ-001',
        type: 'verifies',
        projectIds: [],
        dateCreated: Date.now(),
        lastModified: Date.now(),
      },
    ];

    it('shows artifact selector dropdown', () => {
      render(<TraceabilityDashboard {...defaultProps} standaloneLinks={mockStandaloneLinks} />);
      clickTab('Impact');

      // ImpactAnalysisPanel has a label "Select Artifact" and a select dropdown
      expect(screen.getByText('Select Artifact')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows empty state when no artifact selected', () => {
      render(<TraceabilityDashboard {...defaultProps} standaloneLinks={mockStandaloneLinks} />);
      clickTab('Impact');

      expect(screen.getByText(/Select an artifact above to analyze/)).toBeInTheDocument();
    });

    it('shows connections when artifact is selected', () => {
      render(<TraceabilityDashboard {...defaultProps} standaloneLinks={mockStandaloneLinks} />);
      clickTab('Impact');

      // Select REQ-001
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REQ-001' } });

      // Should show the selected artifact (appears in header)
      expect(screen.getAllByText('REQ-001').length).toBeGreaterThan(0);
      // Should show impact chain with connected artifacts
      expect(screen.getAllByText('UC-001').length).toBeGreaterThan(0);
    });

    it('shows incoming links for requirements from TestCases', () => {
      render(<TraceabilityDashboard {...defaultProps} standaloneLinks={mockStandaloneLinks} />);
      clickTab('Impact');

      // Select REQ-001 which has incoming link from TC-001
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REQ-001' } });

      // TC-001 should appear in the impact chain (labeled with verifies)
      const tcElements = screen.getAllByText('TC-001');
      expect(tcElements.length).toBeGreaterThan(0);
    });

    it('allows clicking connected artifacts to navigate', () => {
      render(<TraceabilityDashboard {...defaultProps} standaloneLinks={mockStandaloneLinks} />);
      clickTab('Impact');

      // Select REQ-001
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REQ-001' } });

      // Click on UC-001 in impact tree - should update selection
      const ucLink = screen.getAllByText('UC-001')[0];
      fireEvent.click(ucLink);

      // Now UC-001 should be the selected artifact (shown in header with bold styling)
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

    it('has type filter toggle buttons', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Matrix');

      // Should have toggle buttons for each type
      expect(screen.getByRole('button', { name: 'UC' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'REQ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'TC' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'INFO' })).toBeInTheDocument();
    });

    it('filters matrix by toggling artifact types', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Matrix');

      // Toggle off UC, TC, INFO - keep only REQ
      fireEvent.click(screen.getByRole('button', { name: 'UC' }));
      fireEvent.click(screen.getByRole('button', { name: 'TC' }));
      fireEvent.click(screen.getByRole('button', { name: 'INFO' }));

      // Should show requirements but not use cases
      expect(screen.getAllByText('REQ-001').length).toBeGreaterThan(0);
      expect(screen.queryByText('UC-001')).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('shows type filter toggles on Gaps tab', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      // Should have toggle buttons for each type
      expect(screen.getByRole('button', { name: 'UC' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'REQ' })).toBeInTheDocument();
    });

    it('filters gaps by toggling types', () => {
      render(<TraceabilityDashboard {...defaultProps} />);
      clickTab('Gaps');

      // Toggle off INFO and UC, keep only REQ and TC
      fireEvent.click(screen.getByRole('button', { name: 'INFO' }));
      fireEvent.click(screen.getByRole('button', { name: 'UC' }));
      fireEvent.click(screen.getByRole('button', { name: 'TC' }));

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
