import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderBar } from '../HeaderBar';
import type { ProjectBaseline } from '../../../types';

describe('HeaderBar', () => {
  const defaultProps = {
    currentProjectName: 'Test Project',
    onNewRequirement: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render project name in breadcrumb', () => {
      render(<HeaderBar {...defaultProps} />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Projects /')).toBeInTheDocument();
    });

    it('should render Create New button', () => {
      render(<HeaderBar {...defaultProps} />);

      expect(screen.getByText('Create New')).toBeInTheDocument();
    });

    it('should render search bar when onSearch is provided', () => {
      const onSearch = vi.fn();
      render(<HeaderBar {...defaultProps} onSearch={onSearch} />);

      expect(screen.getByPlaceholderText('Search... (Ctrl+K)')).toBeInTheDocument();
    });

    it('should not render search bar when onSearch is not provided', () => {
      render(<HeaderBar {...defaultProps} />);

      expect(screen.queryByPlaceholderText('Search... (Ctrl+K)')).not.toBeInTheDocument();
    });

    it('should render History button when onViewHistory is provided', () => {
      const onViewHistory = vi.fn();
      render(<HeaderBar {...defaultProps} onViewHistory={onViewHistory} />);

      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should render Trash button when onTrashOpen is provided', () => {
      const onTrashOpen = vi.fn();
      render(<HeaderBar {...defaultProps} onTrashOpen={onTrashOpen} />);

      expect(screen.getByText('Trash')).toBeInTheDocument();
    });

    it('should render User button when onOpenUserSettings is provided', () => {
      const onOpenUserSettings = vi.fn();
      render(
        <HeaderBar
          {...defaultProps}
          onOpenUserSettings={onOpenUserSettings}
          currentUserName="John"
        />
      );

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should render default User text when no username provided', () => {
      const onOpenUserSettings = vi.fn();
      render(<HeaderBar {...defaultProps} onOpenUserSettings={onOpenUserSettings} />);

      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should call onSearch when typing in search bar', () => {
      const onSearch = vi.fn();
      render(<HeaderBar {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText('Search... (Ctrl+K)');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      expect(onSearch).toHaveBeenCalledWith('test query');
    });
  });

  describe('Create dropdown', () => {
    it('should open Create dropdown when clicked', () => {
      render(<HeaderBar {...defaultProps} />);

      const createButton = screen.getByText('Create New');
      fireEvent.click(createButton);

      expect(screen.getByText('New Requirement')).toBeInTheDocument();
    });

    it('should call onNewRequirement when New Requirement is clicked', () => {
      const onNewRequirement = vi.fn();
      render(<HeaderBar {...defaultProps} onNewRequirement={onNewRequirement} />);

      fireEvent.click(screen.getByText('Create New'));
      fireEvent.click(screen.getByText('New Requirement'));

      expect(onNewRequirement).toHaveBeenCalled();
    });

    it('should show New Use Case when onNewUseCase is provided', () => {
      const onNewUseCase = vi.fn();
      render(<HeaderBar {...defaultProps} onNewUseCase={onNewUseCase} />);

      fireEvent.click(screen.getByText('Create New'));

      expect(screen.getByText('New Use Case')).toBeInTheDocument();
    });

    it('should show New Test Case when onNewTestCase is provided', () => {
      const onNewTestCase = vi.fn();
      render(<HeaderBar {...defaultProps} onNewTestCase={onNewTestCase} />);

      fireEvent.click(screen.getByText('Create New'));

      expect(screen.getByText('New Test Case')).toBeInTheDocument();
    });

    it('should show New Information when onNewInformation is provided', () => {
      const onNewInformation = vi.fn();
      render(<HeaderBar {...defaultProps} onNewInformation={onNewInformation} />);

      fireEvent.click(screen.getByText('Create New'));

      expect(screen.getByText('New Information')).toBeInTheDocument();
    });
  });

  describe('History and Trash buttons', () => {
    it('should call onViewHistory when History is clicked', () => {
      const onViewHistory = vi.fn();
      render(<HeaderBar {...defaultProps} onViewHistory={onViewHistory} />);

      fireEvent.click(screen.getByText('History'));

      expect(onViewHistory).toHaveBeenCalled();
    });

    it('should call onTrashOpen when Trash is clicked', () => {
      const onTrashOpen = vi.fn();
      render(<HeaderBar {...defaultProps} onTrashOpen={onTrashOpen} />);

      fireEvent.click(screen.getByText('Trash'));

      expect(onTrashOpen).toHaveBeenCalled();
    });

    it('should call onOpenUserSettings when User is clicked', () => {
      const onOpenUserSettings = vi.fn();
      render(<HeaderBar {...defaultProps} onOpenUserSettings={onOpenUserSettings} />);

      fireEvent.click(screen.getByText('User'));

      expect(onOpenUserSettings).toHaveBeenCalled();
    });
  });

  describe('Import dropdown', () => {
    it('should open Import dropdown when clicked', () => {
      const onImport = vi.fn();
      render(<HeaderBar {...defaultProps} onImport={onImport} />);

      fireEvent.click(screen.getByText('Import'));

      expect(screen.getByText('Import JSON')).toBeInTheDocument();
    });

    it('should call onImport when Import JSON is clicked', () => {
      const onImport = vi.fn();
      render(<HeaderBar {...defaultProps} onImport={onImport} />);

      fireEvent.click(screen.getByText('Import'));
      fireEvent.click(screen.getByText('Import JSON'));

      expect(onImport).toHaveBeenCalled();
    });

    it('should show Import Excel when onImportExcel is provided', () => {
      const onImportExcel = vi.fn();
      render(<HeaderBar {...defaultProps} onImportExcel={onImportExcel} />);

      fireEvent.click(screen.getByText('Import'));

      expect(screen.getByText('Import Excel')).toBeInTheDocument();
    });

    it('should show Import from Project when onOpenGlobalLibrary is provided', () => {
      const onOpenGlobalLibrary = vi.fn();
      render(<HeaderBar {...defaultProps} onOpenGlobalLibrary={onOpenGlobalLibrary} />);

      fireEvent.click(screen.getByText('Import'));

      expect(screen.getByText('Import from Project')).toBeInTheDocument();
    });
  });

  describe('Export dropdown', () => {
    it('should open Export dropdown when clicked', () => {
      const onExport = vi.fn();
      render(<HeaderBar {...defaultProps} onExport={onExport} />);

      fireEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    it('should show Export to PDF when onExportPDF is provided', () => {
      const onExportPDF = vi.fn();
      render(<HeaderBar {...defaultProps} onExportPDF={onExportPDF} />);

      fireEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Export to PDF')).toBeInTheDocument();
    });

    it('should show Export to Excel when onExportExcel is provided', () => {
      const onExportExcel = vi.fn();
      render(<HeaderBar {...defaultProps} onExportExcel={onExportExcel} />);

      fireEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Export to Excel')).toBeInTheDocument();
    });

    it('should show baseline selection in PDF export', () => {
      const onExportPDF = vi.fn();
      const baselines: ProjectBaseline[] = [
        {
          id: 'baseline-1',
          projectId: 'proj-001',
          name: 'Release 1.0',
          version: '1.0',
          description: 'Release baseline',
          timestamp: 1000000,
          artifactCommits: {},
        },
      ];

      render(<HeaderBar {...defaultProps} onExportPDF={onExportPDF} baselines={baselines} />);

      fireEvent.click(screen.getByText('Export'));

      expect(screen.getByText('Export Version:')).toBeInTheDocument();
      expect(screen.getByText('Current State')).toBeInTheDocument();
      expect(screen.getByText('Release 1.0 (1.0)')).toBeInTheDocument();
    });

    it('should call onExportPDF with selected baseline', () => {
      const onExportPDF = vi.fn();
      const baselines: ProjectBaseline[] = [
        {
          id: 'baseline-1',
          projectId: 'proj-001',
          name: 'Release 1.0',
          version: '1.0',
          description: 'Release baseline',
          timestamp: 1000000,
          artifactCommits: {},
        },
      ];

      render(<HeaderBar {...defaultProps} onExportPDF={onExportPDF} baselines={baselines} />);

      fireEvent.click(screen.getByText('Export'));

      // Select a baseline
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'baseline-1' } });

      fireEvent.click(screen.getByText('Export to PDF'));

      expect(onExportPDF).toHaveBeenCalledWith(baselines[0]);
    });
  });
});
