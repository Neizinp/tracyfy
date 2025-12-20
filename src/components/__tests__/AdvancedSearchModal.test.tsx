import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedSearchModal } from '../AdvancedSearchModal';

// Mock the hooks
vi.mock('../../app/providers', () => ({
  useRequirements: () => ({
    requirements: [
      {
        id: 'REQ-001',
        title: 'User Authentication',
        description: 'Users must be able to log in',
        status: 'active',
        priority: 'high',
        dateCreated: new Date('2024-01-15').getTime(),
        isDeleted: false,
        text: 'The system shall provide user authentication',
        rationale: 'Security requirement',
        author: 'John Doe',
      },
      {
        id: 'REQ-002',
        title: 'Password Reset',
        description: 'Users can reset passwords',
        status: 'draft',
        priority: 'medium',
        dateCreated: new Date('2024-02-20').getTime(),
        isDeleted: false,
        text: 'Users shall be able to reset their password',
        rationale: 'User convenience',
        author: 'Jane Smith',
      },
      {
        id: 'REQ-003',
        title: 'Admin Dashboard',
        description: 'Admin panel for management',
        status: 'active',
        priority: 'high',
        dateCreated: new Date('2024-03-10').getTime(),
        isDeleted: false,
        text: 'Administrators shall have access to a dashboard',
        rationale: 'Management requirement',
        author: 'John Doe',
      },
      {
        id: 'REQ-004',
        title: 'Deleted Requirement',
        description: 'This should not appear',
        status: 'deprecated',
        priority: 'low',
        dateCreated: new Date('2024-01-01').getTime(),
        isDeleted: true,
      },
    ],
  }),
  useUseCases: () => ({
    useCases: [
      {
        id: 'UC-001',
        title: 'Login Flow',
        description: 'User login process',
        status: 'active',
        priority: 'high',
        isDeleted: false,
      },
    ],
  }),
  useTestCases: () => ({
    testCases: [
      {
        id: 'TC-001',
        title: 'Test Login',
        description: 'Verify login works',
        status: 'passed',
        priority: 'high',
        isDeleted: false,
      },
    ],
  }),
  useInformation: () => ({ information: [] }),
  useRisks: () => ({
    risks: [
      {
        id: 'RSK-001',
        title: 'Security Breach',
        description: 'Potential data leak',
        status: 'active',
        impact: 'high',
        isDeleted: false,
      },
    ],
  }),
}));

vi.mock('../../hooks/useCustomAttributes', () => ({
  useCustomAttributes: () => ({
    definitions: [],
  }),
}));

vi.mock('../../services/diskFilterService', () => ({
  diskFilterService: {
    getAllFilters: vi.fn().mockResolvedValue([]),
    createFilter: vi.fn().mockResolvedValue({ id: 'FILTER-001', name: 'Test' }),
    deleteFilter: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('AdvancedSearchModal', () => {
  const mockOnClose = vi.fn();
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    expect(screen.getByText('Advanced Search')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AdvancedSearchModal
        isOpen={false}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    expect(screen.queryByText('Advanced Search')).not.toBeInTheDocument();
  });

  it('shows all non-deleted artifacts by default', () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Should show REQ-001, REQ-002, REQ-003, UC-001, TC-001, RSK-001
    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('REQ-002')).toBeInTheDocument();
    expect(screen.getByText('REQ-003')).toBeInTheDocument();
    expect(screen.getByText('UC-001')).toBeInTheDocument();
    expect(screen.getByText('TC-001')).toBeInTheDocument();
    expect(screen.getByText('RSK-001')).toBeInTheDocument();

    // Should NOT show deleted requirement
    expect(screen.queryByText('REQ-004')).not.toBeInTheDocument();
  });

  it('filters by text search in Any Field', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Type in the value field (first input after property/condition selects)
    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'authentication' } });

    await waitFor(() => {
      // Only REQ-001 contains "authentication"
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-003')).not.toBeInTheDocument();
    });
  });

  it('filters by status using select condition', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Change property to Status
    const propertySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(propertySelect, { target: { value: 'status' } });

    // Select "active" as value
    await waitFor(() => {
      const valueSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(valueSelect, { target: { value: 'active' } });
    });

    await waitFor(() => {
      // Should show only active items
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.getByText('UC-001')).toBeInTheDocument();
      expect(screen.getByText('RSK-001')).toBeInTheDocument();
      // Should NOT show draft item
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
    });
  });

  it('filters by priority', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Change property to Priority
    const propertySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(propertySelect, { target: { value: 'priority' } });

    await waitFor(() => {
      const valueSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(valueSelect, { target: { value: 'high' } });
    });

    await waitFor(() => {
      // Should show only high priority items
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.getByText('UC-001')).toBeInTheDocument();
      expect(screen.getByText('TC-001')).toBeInTheDocument();
      expect(screen.getByText('RSK-001')).toBeInTheDocument();
      // Should NOT show medium priority
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
    });
  });

  it('applies multiple criteria with AND logic', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // First criterion: status = active
    const propertySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(propertySelect, { target: { value: 'status' } });

    await waitFor(() => {
      const valueSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(valueSelect, { target: { value: 'active' } });
    });

    // Add second criterion
    const addButton = screen.getByText('Add Criterion');
    fireEvent.click(addButton);

    // Second criterion: author contains "John"
    await waitFor(() => {
      const propertySelects = screen.getAllByRole('combobox');
      // New criterion's property select should be last
      fireEvent.change(propertySelects[3], { target: { value: 'author' } });
    });

    await waitFor(() => {
      const valueInputs = screen.getAllByPlaceholderText('Enter value...');
      fireEvent.change(valueInputs[0], { target: { value: 'John' } });
    });

    await waitFor(() => {
      // Should only show REQ-001 and REQ-003 (active AND author=John)
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      // Should NOT show others
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
      expect(screen.queryByText('UC-001')).not.toBeInTheDocument();
    });
  });

  it('filters by artifact type', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Change property to Artifact Type
    const propertySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(propertySelect, { target: { value: '_type' } });

    await waitFor(() => {
      const valueSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(valueSelect, { target: { value: 'requirement' } });
    });

    await waitFor(() => {
      // Should show only requirements
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      // Should NOT show use cases, test cases, risks
      expect(screen.queryByText('UC-001')).not.toBeInTheDocument();
      expect(screen.queryByText('TC-001')).not.toBeInTheDocument();
      expect(screen.queryByText('RSK-001')).not.toBeInTheDocument();
    });
  });

  it('filters by date', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Change property to Created Date
    const propertySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(propertySelect, { target: { value: 'dateCreated' } });

    // Change condition to "after"
    await waitFor(() => {
      const conditionSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(conditionSelect, { target: { value: 'after' } });
    });

    // Enter date value
    await waitFor(() => {
      const dateInput = screen.getByPlaceholderText('YYYY-MM-DD');
      fireEvent.change(dateInput, { target: { value: '2024-02-01' } });
    });

    await waitFor(() => {
      // Should show only items created after 2024-02-01
      expect(screen.getByText('REQ-002')).toBeInTheDocument(); // 2024-02-20
      expect(screen.getByText('REQ-003')).toBeInTheDocument(); // 2024-03-10
      // Should NOT show REQ-001 (2024-01-15)
      expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
    });
  });

  it('clears all filters', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Add a filter
    const valueInput = screen.getByPlaceholderText('Enter value...');
    fireEvent.change(valueInput, { target: { value: 'authentication' } });

    await waitFor(() => {
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
    });

    // Click Clear All
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    await waitFor(() => {
      // All items should be back
      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('REQ-002')).toBeInTheDocument();
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
    });
  });

  it('navigates to artifact on click', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Click on REQ-001 result
    const result = screen.getByText('User Authentication');
    fireEvent.click(result);

    expect(mockOnNavigate).toHaveBeenCalledWith('requirement', 'REQ-001');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('combines type filter with text search', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // First criterion: type = requirement
    const propertySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(propertySelect, { target: { value: '_type' } });

    await waitFor(() => {
      const valueSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(valueSelect, { target: { value: 'requirement' } });
    });

    // Add second criterion: title contains "Admin"
    const addButton = screen.getByText('Add Criterion');
    fireEvent.click(addButton);

    await waitFor(() => {
      const propertySelects = screen.getAllByRole('combobox');
      fireEvent.change(propertySelects[3], { target: { value: 'title' } });
    });

    await waitFor(() => {
      const valueInputs = screen.getAllByPlaceholderText('Enter value...');
      fireEvent.change(valueInputs[0], { target: { value: 'Admin' } });
    });

    await waitFor(() => {
      // Should only show REQ-003 (requirement AND title contains Admin)
      expect(screen.getByText('REQ-003')).toBeInTheDocument();
      expect(screen.queryByText('REQ-001')).not.toBeInTheDocument();
      expect(screen.queryByText('REQ-002')).not.toBeInTheDocument();
    });
  });

  it('removes a criterion', async () => {
    render(
      <AdvancedSearchModal
        isOpen={true}
        onClose={mockOnClose}
        onNavigateToArtifact={mockOnNavigate}
      />
    );

    // Add second criterion
    const addButton = screen.getByText('Add Criterion');
    fireEvent.click(addButton);

    await waitFor(() => {
      // Should have 2 property selects now
      const propertySelects = screen.getAllByRole('combobox');
      expect(propertySelects.length).toBeGreaterThan(3);
    });

    // Remove the second criterion (click X button)
    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('svg[class*="lucide-x"]'));
    // Click the last remove button
    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[removeButtons.length - 1]);
    }

    await waitFor(() => {
      // Should be back to 2 comboboxes (property, condition - value is text input not combobox)
      const propertySelects = screen.getAllByRole('combobox');
      expect(propertySelects.length).toBe(2);
    });
  });
});
