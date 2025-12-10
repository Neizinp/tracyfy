import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useImportExport } from '../useImportExport';
import type { Requirement, UseCase, TestCase, Information, Project } from '../../types';

// Mock jsonExportUtils
vi.mock('../../utils/jsonExportUtils', () => ({
  exportProjectToJSON: vi.fn().mockResolvedValue(undefined),
}));

// Mock XLSX
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

describe('useImportExport', () => {
  let mockProjects: Project[];
  let mockRequirements: Requirement[];
  let mockUseCases: UseCase[];
  let mockTestCases: TestCase[];
  let mockInformation: Information[];
  let mockSetRequirements: ReturnType<typeof vi.fn>;
  let mockSetUseCases: ReturnType<typeof vi.fn>;
  let mockSetTestCases: ReturnType<typeof vi.fn>;
  let mockSetInformation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProjects = [
      {
        id: 'proj-001',
        name: 'Test Project',
        description: 'Test Description',
        requirementIds: ['REQ-001'],
        useCaseIds: ['UC-001'],
        testCaseIds: ['TC-001'],
        informationIds: ['INFO-001'],
        lastModified: 1000000,
      },
    ];

    mockRequirements = [
      {
        id: 'REQ-001',
        title: 'Requirement 1',
        text: 'Text',
        status: 'draft',
        priority: 'high',
        description: '',
        rationale: '',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        linkedArtifacts: [],
        isDeleted: false,
      },
    ];

    mockUseCases = [
      {
        id: 'UC-001',
        title: 'Use Case 1',
        description: '',
        actor: '',
        preconditions: '',
        mainFlow: '',
        alternativeFlows: '',
        postconditions: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        lastModified: 1000000,
        linkedArtifacts: [],
        isDeleted: false,
      },
    ];

    mockTestCases = [
      {
        id: 'TC-001',
        title: 'Test Case 1',
        description: '',
        status: 'draft',
        priority: 'medium',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        requirementIds: [],
        author: '',
        isDeleted: false,
      },
    ];

    mockInformation = [
      {
        id: 'INFO-001',
        title: 'Information 1',
        content: '',
        category: 'general',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        linkedArtifacts: [],
        isDeleted: false,
      },
    ];

    mockSetRequirements = vi.fn();
    mockSetUseCases = vi.fn();
    mockSetTestCases = vi.fn();
    mockSetInformation = vi.fn();
  });

  const createHook = (currentProjectId = 'proj-001') =>
    useImportExport({
      currentProjectId,
      projects: mockProjects,
      requirements: mockRequirements,
      useCases: mockUseCases,
      testCases: mockTestCases,
      information: mockInformation,
      setRequirements: mockSetRequirements,
      setUseCases: mockSetUseCases,
      setTestCases: mockSetTestCases,
      setInformation: mockSetInformation,
    });

  describe('handleExport', () => {
    it('should call exportProjectToJSON with correct parameters', async () => {
      const { exportProjectToJSON } = await import('../../utils/jsonExportUtils');
      const hook = createHook();

      await hook.handleExport();

      expect(exportProjectToJSON).toHaveBeenCalledWith(
        mockProjects[0],
        {
          requirements: mockRequirements,
          useCases: mockUseCases,
          testCases: mockTestCases,
          information: mockInformation,
        },
        mockProjects[0].requirementIds,
        mockProjects[0].useCaseIds,
        mockProjects[0].testCaseIds,
        mockProjects[0].informationIds
      );
    });

    it('should show alert if no project is selected', async () => {
      const alertMock = vi.fn();
      vi.stubGlobal('alert', alertMock);

      const hook = createHook('non-existent-project');

      await hook.handleExport();

      expect(alertMock).toHaveBeenCalledWith('No project selected');
    });

    it('should handle export errors gracefully', async () => {
      const { exportProjectToJSON } = await import('../../utils/jsonExportUtils');
      (exportProjectToJSON as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Export failed')
      );
      const alertMock = vi.fn();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('alert', alertMock);

      const hook = createHook();

      await hook.handleExport();

      expect(consoleError).toHaveBeenCalledWith('Failed to export project:', expect.any(Error));
      expect(alertMock).toHaveBeenCalledWith('Failed to export project: Error: Export failed');
      consoleError.mockRestore();
    });
  });

  describe('handleImport', () => {
    it('should create file input and set up change handler', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const hook = createHook();

      hook.handleImport();

      expect(createElementSpy).toHaveBeenCalledWith('input');
      createElementSpy.mockRestore();
    });

    it('should parse JSON and set state correctly', () => {
      const hook = createHook();

      // Mock document.createElement to capture the input element
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement);

      // Create a mock FileReader class
      class MockFileReader {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        readAsText() {
          if (this.onload) {
            this.onload({
              target: {
                result: JSON.stringify({
                  requirements: [{ id: 'REQ-002', title: 'Imported Requirement' }],
                  useCases: [{ id: 'UC-002', title: 'Imported Use Case' }],
                  testCases: [{ id: 'TC-002', title: 'Imported Test Case' }],
                  information: [{ id: 'INFO-002', title: 'Imported Information' }],
                }),
              },
            } as unknown as ProgressEvent<FileReader>);
          }
        }
      }

      vi.stubGlobal('FileReader', MockFileReader);

      hook.handleImport();

      // Simulate file selection
      if (mockInput.onchange) {
        mockInput.onchange({
          target: { files: [new File(['{}'], 'test.json')] },
        } as unknown as Event);

        expect(mockSetRequirements).toHaveBeenCalledWith([
          { id: 'REQ-002', title: 'Imported Requirement' },
        ]);
        expect(mockSetUseCases).toHaveBeenCalledWith([
          { id: 'UC-002', title: 'Imported Use Case' },
        ]);
        expect(mockSetTestCases).toHaveBeenCalledWith([
          { id: 'TC-002', title: 'Imported Test Case' },
        ]);
        expect(mockSetInformation).toHaveBeenCalledWith([
          { id: 'INFO-002', title: 'Imported Information' },
        ]);
      }

      vi.restoreAllMocks();
    });

    it('should handle missing arrays in import data', () => {
      const hook = createHook();

      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement);

      // Create a mock FileReader class
      class MockFileReader {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        readAsText() {
          if (this.onload) {
            this.onload({
              target: { result: '{}' },
            } as unknown as ProgressEvent<FileReader>);
          }
        }
      }

      vi.stubGlobal('FileReader', MockFileReader);

      hook.handleImport();

      if (mockInput.onchange) {
        mockInput.onchange({
          target: { files: [new File(['{}'], 'test.json')] },
        } as unknown as Event);

        expect(mockSetRequirements).toHaveBeenCalledWith([]);
        expect(mockSetUseCases).toHaveBeenCalledWith([]);
        expect(mockSetTestCases).toHaveBeenCalledWith([]);
        expect(mockSetInformation).toHaveBeenCalledWith([]);
      }

      vi.restoreAllMocks();
    });

    it('should show alert on JSON parse error', () => {
      const alertMock = vi.fn();
      vi.stubGlobal('alert', alertMock);

      const hook = createHook();

      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement);

      // Create a mock FileReader class
      class MockFileReader {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        readAsText() {
          if (this.onload) {
            this.onload({
              target: { result: 'not valid json' },
            } as unknown as ProgressEvent<FileReader>);
          }
        }
      }

      vi.stubGlobal('FileReader', MockFileReader);

      hook.handleImport();

      if (mockInput.onchange) {
        mockInput.onchange({
          target: { files: [new File(['not valid json'], 'test.json')] },
        } as unknown as Event);

        expect(alertMock).toHaveBeenCalledWith('Failed to parse JSON file');
      }

      vi.restoreAllMocks();
    });
  });

  describe('handleImportExcel', () => {
    it('should create file input for Excel files', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const hook = createHook();

      hook.handleImportExcel();

      expect(createElementSpy).toHaveBeenCalledWith('input');
      createElementSpy.mockRestore();
    });

    it('should accept xlsx and xls file types', () => {
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement);

      const hook = createHook();
      hook.handleImportExcel();

      expect(mockInput.accept).toBe('.xlsx,.xls');
      vi.restoreAllMocks();
    });
  });

  describe('returned functions', () => {
    it('should return all expected functions', () => {
      const hook = createHook();

      expect(hook).toHaveProperty('handleExport');
      expect(hook).toHaveProperty('handleImport');
      expect(hook).toHaveProperty('handleImportExcel');
      expect(typeof hook.handleExport).toBe('function');
      expect(typeof hook.handleImport).toBe('function');
      expect(typeof hook.handleImportExcel).toBe('function');
    });
  });
});
