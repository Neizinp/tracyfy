import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useImportExport, type ImportNotify } from '../useImportExport';
import type { ImportBundle } from '../../utils/importUtils';
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
  let mockProject: Project;
  let mockRequirements: Requirement[];
  let mockUseCases: UseCase[];
  let mockTestCases: TestCase[];
  let mockInformation: Information[];
  let mockApplyImport: Mock<(bundle: ImportBundle) => Promise<void>>;
  let mockNotify: Mock<ImportNotify>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockProject = { name: 'Test Project', description: 'Test Description' };

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
        author: '',
        isDeleted: false,
      },
    ];

    mockInformation = [
      {
        id: 'INFO-001',
        title: 'Information 1',
        type: 'note',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        isDeleted: false,
      },
    ];

    mockApplyImport = vi.fn<(bundle: ImportBundle) => Promise<void>>().mockResolvedValue(undefined);
    mockNotify = vi.fn<ImportNotify>();
  });

  const useTestHook = () =>
    useImportExport({
      project: mockProject,
      requirements: mockRequirements,
      useCases: mockUseCases,
      testCases: mockTestCases,
      information: mockInformation,
      risks: [],
      documents: [],
      applyImport: mockApplyImport,
      notify: mockNotify,
    });

  describe('handleExport', () => {
    it('should call exportProjectToJSON with correct parameters', async () => {
      const { exportProjectToJSON } = await import('../../utils/jsonExportUtils');
      const hook = useTestHook();

      await hook.handleExport();

      expect(exportProjectToJSON).toHaveBeenCalledWith(
        mockProject,
        {
          requirements: mockRequirements,
          useCases: mockUseCases,
          testCases: mockTestCases,
          information: mockInformation,
          documents: [],
        },
        mockRequirements.map((r) => r.id),
        mockUseCases.map((u) => u.id),
        mockTestCases.map((t) => t.id),
        mockInformation.map((i) => i.id),
        [],
        []
      );
    });

    it('should handle export errors gracefully', async () => {
      const { exportProjectToJSON } = await import('../../utils/jsonExportUtils');
      (exportProjectToJSON as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Export failed')
      );
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hook = useTestHook();

      await hook.handleExport();

      expect(consoleError).toHaveBeenCalledWith('Failed to export project:', expect.any(Error));
      expect(mockNotify).toHaveBeenCalledWith(
        'Failed to export project: Error: Export failed',
        'error'
      );
      consoleError.mockRestore();
    });
  });

  describe('handleImport', () => {
    /** Simulate picking a JSON file with the given text content */
    const importJson = async (hook: ReturnType<typeof useTestHook>, content: string) => {
      const mockInput = {
        type: '',
        accept: '',
        onchange: null as ((e: Event) => void) | null,
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockInput as unknown as HTMLElement);

      class MockFileReader {
        onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        readAsText() {
          this.onload?.({ target: { result: content } } as unknown as ProgressEvent<FileReader>);
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);

      hook.handleImport();
      mockInput.onchange?.({
        target: { files: [new File([content], 'test.json')] },
      } as unknown as Event);
      // let the async import pipeline settle
      await new Promise((r) => setTimeout(r, 0));
      vi.restoreAllMocks();
      return mockInput;
    };

    it('should create file input and set up change handler', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const hook = useTestHook();

      hook.handleImport();

      expect(createElementSpy).toHaveBeenCalledWith('input');
      createElementSpy.mockRestore();
    });

    it('should parse JSON and pass validated artifacts to applyImport', async () => {
      await importJson(
        useTestHook(),
        JSON.stringify({
          requirements: [{ id: 'REQ-002', title: 'Imported Requirement' }],
          useCases: [{ id: 'UC-002', title: 'Imported Use Case' }],
          testCases: [{ id: 'TC-002', title: 'Imported Test Case' }],
          information: [{ id: 'INFO-002', title: 'Imported Information' }],
        })
      );

      expect(mockApplyImport).toHaveBeenCalledTimes(1);
      const bundle = mockApplyImport.mock.calls[0][0];
      expect(bundle.requirements).toEqual([{ id: 'REQ-002', title: 'Imported Requirement' }]);
      expect(bundle.useCases).toEqual([{ id: 'UC-002', title: 'Imported Use Case' }]);
      expect(bundle.testCases).toEqual([{ id: 'TC-002', title: 'Imported Test Case' }]);
      expect(bundle.information).toEqual([{ id: 'INFO-002', title: 'Imported Information' }]);
      expect(bundle.skipped).toEqual([]);
    });

    it('should not call applyImport (and never wipe data) when the file has no artifacts', async () => {
      await importJson(useTestHook(), '{}');

      expect(mockApplyImport).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith('No artifacts found in file', 'warning');
    });

    it('should skip rows with unsafe IDs and report them', async () => {
      await importJson(
        useTestHook(),
        JSON.stringify({
          requirements: [
            { id: '../../etc/passwd', title: 'Evil' },
            { id: 'REQ-003', title: 'Fine' },
          ],
        })
      );

      const bundle = mockApplyImport.mock.calls[0][0];
      expect(bundle.requirements.map((r) => r.id)).toEqual(['REQ-003']);
      expect(mockNotify).toHaveBeenCalledWith(
        expect.stringContaining('Skipped 1 invalid row'),
        'warning'
      );
    });

    it('should notify on JSON parse error', async () => {
      await importJson(useTestHook(), 'not valid json');

      expect(mockApplyImport).not.toHaveBeenCalled();
      expect(mockNotify).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse JSON file'),
        'error'
      );
    });

    it('should notify when persisting fails', async () => {
      mockApplyImport.mockRejectedValue(new Error('disk full'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await importJson(
        useTestHook(),
        JSON.stringify({ requirements: [{ id: 'REQ-004', title: 'X' }] })
      );

      expect(mockNotify).toHaveBeenCalledWith('Import failed: disk full', 'error');
      consoleError.mockRestore();
    });
  });

  describe('handleImportExcel', () => {
    it('should create file input for Excel files', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const hook = useTestHook();

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

      const hook = useTestHook();
      hook.handleImportExcel();

      expect(mockInput.accept).toBe('.xlsx,.xls');
      vi.restoreAllMocks();
    });
  });

  describe('returned functions', () => {
    it('should return all expected functions', () => {
      const hook = useTestHook();

      expect(hook).toHaveProperty('handleExport');
      expect(hook).toHaveProperty('handleImport');
      expect(hook).toHaveProperty('handleImportExcel');
      expect(typeof hook.handleExport).toBe('function');
      expect(typeof hook.handleImport).toBe('function');
      expect(typeof hook.handleImportExcel).toBe('function');
    });
  });
});
