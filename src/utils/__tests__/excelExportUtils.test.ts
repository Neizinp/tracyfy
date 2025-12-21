import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportProjectToExcel } from '../excelExportUtils';
import type { Project, Requirement, UseCase, TestCase, Information } from '../../types';

// Types for XLSX library mocks
type WorkBook = { Sheets: Record<string, unknown>; SheetNames: string[] };
type WorkSheet = Record<string, unknown>;

// Mock XLSX
const mockBookNew = vi.fn(() => ({ Sheets: {}, SheetNames: [] }));
const mockJsonToSheet = vi.fn((_data: unknown[]) => ({}));
const mockBookAppendSheet = vi.fn();
const mockWriteFile = vi.fn();
const mockWrite = vi.fn();

vi.mock('xlsx', () => ({
  utils: {
    book_new: () => mockBookNew(),
    json_to_sheet: (data: unknown[]) => mockJsonToSheet(data),
    book_append_sheet: (wb: WorkBook, ws: WorkSheet, name: string) =>
      mockBookAppendSheet(wb, ws, name),
  },
  writeFile: (wb: WorkBook, filename: string) => mockWriteFile(wb, filename),
  write: (wb: WorkBook, options: { type: string; bookType: string }) => mockWrite(wb, options),
}));

// Mock gitService
vi.mock('../../services/gitService', () => ({
  gitService: {
    getArtifactHistory: vi.fn().mockResolvedValue([]),
  },
}));

// Mock diskCustomAttributeService
vi.mock('../../services/diskCustomAttributeService', () => ({
  diskCustomAttributeService: {
    getAllDefinitions: vi.fn().mockResolvedValue([]),
  },
}));

// Mock diskLinkService
vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getLinksForProject: vi.fn().mockResolvedValue([]),
  },
}));

// Default export options for tests
const defaultOptions = {
  format: 'excel' as const,
  baseline: null,
  includeRequirements: true,
  includeUseCases: true,
  includeTestCases: true,
  includeInformation: true,
  includeRisks: false,
  includeLinks: false,
  includeRevisionHistory: false,
  includeTraceability: true,
  includeVerificationMatrix: false,
  includeTitlePage: false,
  includeDocuments: false,
};

describe('excelExportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject: Project = {
    id: 'p1',
    name: 'Test Project',
    description: 'Test Description',
    requirementIds: ['r1'],
    useCaseIds: ['u1'],
    testCaseIds: ['t1'],
    informationIds: ['i1'],
    riskIds: [],
    lastModified: 0,
    currentBaseline: 'Baseline 1.0',
  };

  const mockReq: Requirement = {
    id: 'r1',
    title: 'My Requirement',
    description: 'Desc',
    text: 'Req text',
    rationale: 'Rationale',
    status: 'draft',
    priority: 'high',

    lastModified: 0,
    revision: '01',
    dateCreated: 0,
  };

  const mockUseCase: UseCase = {
    id: 'u1',
    title: 'My Use Case',
    description: 'Desc',
    actor: 'User',
    preconditions: '',
    postconditions: '',
    mainFlow: 'Step 1. Do this.',
    priority: 'medium',
    status: 'draft',
    lastModified: 0,
    revision: '01',
  };

  const mockTestCase: TestCase = {
    id: 't1',
    title: 'My Test Case',
    description: 'Test Steps',
    status: 'draft',
    priority: 'high',
    lastModified: 0,
    revision: '01',
    dateCreated: 0,
    requirementIds: [],
  };

  const mockInfo: Information = {
    id: 'i1',
    title: 'My Info',
    text: 'Info Content',
    type: 'note',
    lastModified: 0,
    revision: '01',
    dateCreated: 0,
  };

  const globalState = {
    requirements: [mockReq],
    useCases: [mockUseCase],
    testCases: [mockTestCase],
    information: [mockInfo],
  };

  it('should create separate sheets for each artifact type', async () => {
    await exportProjectToExcel(
      mockProject,
      globalState,
      ['r1'],
      ['u1'],
      ['t1'],
      ['i1'],
      [],
      defaultOptions
    );

    // Verify sheets are appended
    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Requirements'
    );
    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Use Cases'
    );
    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Test Cases'
    );
    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Information'
    );
    expect(mockBookAppendSheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Traceability Matrix'
    );
  });

  it('should exclude deleted artifacts', async () => {
    const requirements: Requirement[] = [
      { ...mockReq, id: 'r1' },
      { ...mockReq, id: 'r2', isDeleted: true },
    ];

    await exportProjectToExcel(
      mockProject,
      { ...globalState, requirements },
      ['r1', 'r2'],
      [],
      [],
      [],
      [],
      defaultOptions
    );

    // Check that json_to_sheet was called with only 1 requirement
    // The first call to json_to_sheet is likely for Revision History (if empty, it might skip?)
    // Actually, if history is empty, it skips Revision History sheet.
    // So first call should be Requirements.

    // We need to inspect the arguments to mockJsonToSheet
    const calls = mockJsonToSheet.mock.calls;
    // Find the call that corresponds to requirements
    const reqCall = calls.find(
      (call) =>
        Array.isArray(call[0]) &&
        call[0].length > 0 &&
        (call[0][0] as Record<string, unknown>).ID === 'r1'
    );

    expect(reqCall).toBeDefined();
    if (reqCall) {
      expect(reqCall[0]).toHaveLength(1);
      expect((reqCall[0] as Record<string, unknown>[])[0].ID).toBe('r1');
    }
  });

  it('should set column widths', async () => {
    // We can't easily check the return value of json_to_sheet since we mocked it to return {},
    // but we can check if we assigned to !cols on the returned object.
    // However, since we mocked it to return a plain object, we can spy on that object or just trust the code logic if we can't mock the assignment.
    // Actually, in the code: wsReq['!cols'] = ...
    // Since mockJsonToSheet returns {}, the code assigns to {}.!cols.
    // We can make mockJsonToSheet return an object we can inspect.

    const mockSheet: Record<string, unknown> = {};
    mockJsonToSheet.mockReturnValue(mockSheet);

    await exportProjectToExcel(mockProject, globalState, ['r1'], [], [], [], [], defaultOptions);

    expect(mockSheet['!cols']).toBeDefined();
    expect((mockSheet['!cols'] as unknown[]).length).toBeGreaterThan(0);
  });

  it('should fallback to writeFile if showSaveFilePicker is not available', async () => {
    delete (window as unknown as Record<string, unknown>).showSaveFilePicker;

    await exportProjectToExcel(mockProject, globalState, ['r1'], [], [], [], [], defaultOptions);

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.anything(),
      'Test_Project_Baseline_1_0-export.xlsx'
    );
  });
});
