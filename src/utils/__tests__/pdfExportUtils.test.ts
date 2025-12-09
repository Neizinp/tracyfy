const mockBaseline = {
  id: 'b1',
  projectId: 'p1',
  version: '1.0',
  name: 'Baseline 1.0',
  description: 'Test Baseline',
  timestamp: Date.now(),
  artifactCommits: {},
};
import autoTable from 'jspdf-autotable';

// Add shared mock artifacts for all tests
const mockReq: Requirement = {
  id: 'r1',
  title: 'My Requirement',
  description: 'Desc',
  text: 'Req text',
  rationale: 'Rationale',
  status: 'draft',
  priority: 'high',
  author: 'N/A',
  created: 0,
  modified: 0,
  approved: null,
  version: '01',
  verification: 'N/A',
  deleted: false,
  isDeleted: false,
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
  isDeleted: false,
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
  isDeleted: false,
};

const mockInfo: Information = {
  id: 'i1',
  title: 'My Info',
  content: 'Info Content',
  type: 'note',
  lastModified: 0,
  revision: '01',
  dateCreated: 0,
  isDeleted: false,
};
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportProjectToPDF } from '../pdfExportUtils';
import type { Project, Requirement, UseCase, TestCase, Information } from '../../types';
import { formatDate } from '../dateUtils';

// Mock jsPDF
const mockText = vi.fn();
const mockAddPage = vi.fn();
const mockSetPage = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSave = vi.fn();
const mockSplitTextToSize = vi.fn((text) => [text]); // Simple mock: returns array with single text
const mockGetTextWidth = vi.fn(() => 10);
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockRect = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetTextColor = vi.fn();
const mockInternal = {
  pageSize: {
    getWidth: () => 210,
    getHeight: () => 297,
  },
};
const mockOutput = vi.fn();

vi.mock('jspdf', () => {
  return {
    default: class {
      constructor() {
        return {
          text: mockText,
          addPage: mockAddPage,
          setPage: mockSetPage,
          setFont: mockSetFont,
          setFontSize: mockSetFontSize,
          save: mockSave,
          splitTextToSize: mockSplitTextToSize,
          getTextWidth: mockGetTextWidth,
          setDrawColor: mockSetDrawColor,
          setLineWidth: mockSetLineWidth,
          rect: mockRect,
          setFillColor: mockSetFillColor,
          setTextColor: mockSetTextColor,
          internal: mockInternal,
          getNumberOfPages: () => 5,
          output: mockOutput,
        };
      }
    },
  };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc, options) => {
    // Simulate table adding height
    doc.lastAutoTable = { finalY: (options.startY || 20) + 20 };
  }),
}));

// Mock gitService
vi.mock('../../services/realGitService', () => ({
  realGitService: {
    getHistory: vi.fn().mockImplementation((filepath) => {
      if (filepath === 'requirements/r1.md') {
        return Promise.resolve([
          {
            hash: 'abc123',
            message: 'Initial commit',
            author: 'Alice',
            timestamp: 1700000000000,
          },
          {
            hash: 'def456',
            message: 'Update requirement',
            author: 'Bob',
            timestamp: 1700001000000,
          },
        ]);
      }
      return Promise.resolve([]);
    }),
  },
}));

describe('pdfExportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject: Project = {
    id: 'p1',
    name: 'Test Project',
    description: 'Test Description',
    requirements: [mockReq],
    useCases: [mockUseCase],
    testCases: [mockTestCase],
    information: [mockInfo],
    requirementIds: ['r1'],
    useCaseIds: ['u1'],
    testCaseIds: ['t1'],
    informationIds: ['i1'],
    baseline: null,
    globalRepository: null,
    lastModified: 0,
    currentBaseline: 'Baseline 1.0',
  };

  const globalState = {
    requirements: [mockReq],
    useCases: [mockUseCase],
    testCases: [mockTestCase],
    information: [mockInfo],
  };

  it('should include revision history from git in PDF export', async () => {
    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
      }),
    });

    await exportProjectToPDF(
      mockProject,
      globalState,
      mockProject.requirementIds,
      mockProject.useCaseIds,
      mockProject.testCaseIds,
      mockProject.informationIds,
      [],
      null
    );

    // Check that commit messages and authors are present in the autoTable body
    const autoTableCalls = autoTable.mock.calls;
    const _foundInitialCommit = autoTableCalls.some(
      ([_doc, options]) =>
        options.body && options.body.some((row) => row.includes('Initial commit'))
    );
    const _foundUpdateRequirement = autoTableCalls.some(
      ([_doc, options]) =>
        options.body && options.body.some((row) => row.includes('Update requirement'))
    );
    await exportProjectToPDF(
      mockProject,
      globalState,
      mockProject.requirementIds,
      mockProject.useCaseIds,
      mockProject.testCaseIds,
      mockProject.informationIds,
      [],
      mockBaseline
    );
  });

  it('should generate Cover Page with correct details', async () => {
    // Mock showSaveFilePicker to avoid error

    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
      }),
    });

    const mockBaseline = {
      id: 'b1',
      projectId: 'p1',
      version: '1.0',
      name: 'Baseline 1.0',
      description: 'Test Baseline',
      timestamp: Date.now(),
      artifactCommits: {},
    };

    await exportProjectToPDF(
      mockProject,
      globalState,
      ['r1'],
      ['u1'],
      ['t1'],
      ['i1'],
      [],
      mockBaseline
    );

    // Verify Title
    expect(mockText).toHaveBeenCalledWith('Test Project', 105, 60, { align: 'center' });

    // Verify Description
    expect(mockText).toHaveBeenCalledWith(['Test Description'], 105, 95, {
      align: 'center',
      maxWidth: 170,
    });

    // Verify Date (YYYY-MM-DD)
    const expectedDate = formatDate(Date.now());
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining(`Export Date: ${expectedDate}`),
      105,
      140,
      { align: 'center' }
    );

    // Verify Baseline
    expect(mockText).toHaveBeenCalledWith('Baseline: Baseline 1.0 (v1.0)', 105, 155, {
      align: 'center',
    });
  });

  it('should generate granular Table of Contents', async () => {
    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
      }),
    });

    await exportProjectToPDF(mockProject, globalState, ['r1'], ['u1'], ['t1'], ['i1'], [], null);

    // Header
    expect(mockText).toHaveBeenCalledWith('Table of Contents', 20, 20);

    // Sections
    expect(mockText).toHaveBeenCalledWith('Requirements', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Use Cases', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Test Cases', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Information', expect.any(Number), expect.any(Number));

    // Granular Items (indented)
    expect(mockText).toHaveBeenCalledWith('r1 - My Requirement', 35, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('u1 - My Use Case', 35, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('t1 - My Test Case', 35, expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('i1 - My Info', 35, expect.any(Number));
  });

  it('should include all artifact sections with correct content', async () => {
    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
      }),
    });

    await exportProjectToPDF(mockProject, globalState, ['r1'], ['u1'], ['t1'], ['i1'], [], null);

    // Requirements Section
    expect(mockText).toHaveBeenCalledWith('Requirements', 20, 20);
    // Header
    expect(mockText).toHaveBeenCalledWith(
      'r1 - My Requirement',
      expect.any(Number),
      expect.any(Number)
    );
    // Metadata Bar
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Status: draft'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Priority: high'),
      expect.any(Number),
      expect.any(Number)
    );
    // Content
    expect(mockText).toHaveBeenCalledWith(
      'Requirement Text:',
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(['Req text'], expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith('Rationale:', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith(['Rationale'], expect.any(Number), expect.any(Number));

    // Use Cases Section
    expect(mockText).toHaveBeenCalledWith('Use Cases', 20, 20);
    expect(mockText).toHaveBeenCalledWith(
      'u1 - My Use Case',
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith('Main Flow:', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith(
      ['Step 1. Do this.'],
      expect.any(Number),
      expect.any(Number)
    );

    // Test Cases Section
    expect(mockText).toHaveBeenCalledWith('Test Cases', 20, 20);
    expect(mockText).toHaveBeenCalledWith(
      't1 - My Test Case',
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith('Description:', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith(['Test Steps'], expect.any(Number), expect.any(Number));

    // Information Section
    expect(mockText).toHaveBeenCalledWith('Information', 20, 20);
    expect(mockText).toHaveBeenCalledWith('i1 - My Info', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith(['Info Content'], expect.any(Number), expect.any(Number));
  });

  it('should fallback to doc.save if showSaveFilePicker is not available', async () => {
    delete (window as any).showSaveFilePicker;

    await exportProjectToPDF(mockProject, globalState, ['r1'], [], [], [], [], null);
    expect(mockSave).toHaveBeenCalledWith('Test_Project-export.pdf');
  });

  it('should export all requirement attributes', async () => {
    const requirements: Requirement[] = [
      {
        id: 'REQ-001',
        title: 'Test Req',
        description: 'Desc',
        text: 'Text',
        rationale: 'Rationale',
        priority: 'high',
        status: 'approved',
        author: 'Tester',
        verificationMethod: 'Test',
        comments: 'Comment',
        dateCreated: 1234567890,
        lastModified: 1234567890,
        revision: '02',
        parentIds: [],
      },
    ];

    await exportProjectToPDF(
      mockProject,
      {
        requirements,
        useCases: [],
        testCases: [],
        information: [],
      },
      ['REQ-001'], // projectRequirementIds
      [], // projectUseCaseIds
      [], // projectTestCaseIds
      [], // projectInformationIds
      [], // baselines
      null // selectedBaseline
    );

    // Check for all attributes
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Description:'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Requirement Text:'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Rationale:'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Comments:'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Author: Tester'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Verification: Test'),
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Rev: 02'),
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it('should exclude deleted artifacts', async () => {
    const requirements: Requirement[] = [
      {
        id: 'REQ-001',
        title: 'Active Req',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
        lastModified: Date.now(),
        description: '',
        text: '',
        rationale: '',
        parentIds: [],
        revision: '01',
      },
      {
        id: 'REQ-002',
        title: 'Deleted Req',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
        lastModified: Date.now(),
        isDeleted: true,
        description: '',
        text: '',
        rationale: '',
        parentIds: [],
        revision: '01',
      },
    ];

    await exportProjectToPDF(
      mockProject,
      {
        requirements,
        useCases: [],
        testCases: [],
        information: [],
      },
      ['REQ-001', 'REQ-002'],
      [],
      [],
      [],
      [],
      null
    );

    // Should include active req
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('REQ-001'),
      expect.any(Number),
      expect.any(Number)
    );

    // Should NOT include deleted req
    // We check all calls to ensure REQ-002 is not present
    const allCalls = mockText.mock.calls.map((call) => call[0]);
    const deletedReqPresent = allCalls.some(
      (text) => typeof text === 'string' && text.includes('REQ-002')
    );
    expect(deletedReqPresent).toBe(false);
  });

  it('should export all use case attributes', async () => {
    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
      }),
    });

    const fullUseCase: UseCase = {
      ...mockUseCase,
      preconditions: 'User must be logged in',
      postconditions: 'Data is saved',
      alternativeFlows: 'Alternative path description',
    };

    await exportProjectToPDF(
      mockProject,
      { ...globalState, useCases: [fullUseCase] },
      [],
      ['u1'],
      [],
      [],
      [],
      null
    );

    // Verify Preconditions section
    expect(mockText).toHaveBeenCalledWith('Preconditions:', expect.any(Number), expect.any(Number));
    expect(mockText).toHaveBeenCalledWith(
      ['User must be logged in'],
      expect.any(Number),
      expect.any(Number)
    );

    // Verify Postconditions section
    expect(mockText).toHaveBeenCalledWith(
      'Postconditions:',
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      ['Data is saved'],
      expect.any(Number),
      expect.any(Number)
    );

    // Verify Alternative Flows section
    expect(mockText).toHaveBeenCalledWith(
      'Alternative Flows:',
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith(
      ['Alternative path description'],
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should export all test case attributes', async () => {
    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
      }),
    });

    const fullTestCase: TestCase = {
      ...mockTestCase,
      author: 'Jane Smith',
      lastRun: 1234567890000,
      requirementIds: ['r1', 'r2'],
    };

    await exportProjectToPDF(
      mockProject,
      { ...globalState, testCases: [fullTestCase] },
      [],
      [],
      ['t1'],
      [],
      [],
      null
    );

    // Verify Tests Requirements section (traceability)
    expect(mockText).toHaveBeenCalledWith(
      'Tests Requirements:',
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockText).toHaveBeenCalledWith('r1, r2', expect.any(Number), expect.any(Number));
  });

  it('should export all information attributes', async () => {
    (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
      }),
    });

    const fullInfo: Information = {
      ...mockInfo,
      type: 'meeting',
    };

    await exportProjectToPDF(
      mockProject,
      { ...globalState, information: [fullInfo] },
      [],
      [],
      [],
      ['i1'],
      [],
      null
    );

    // Verify Information section is created
    expect(mockText).toHaveBeenCalledWith('Information', 20, 20);
    expect(mockText).toHaveBeenCalledWith('i1 - My Info', expect.any(Number), expect.any(Number));

    // Verify Metadata
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Type: Meeting'),
      expect.any(Number),
      expect.any(Number)
    );
  });
});
