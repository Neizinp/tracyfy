import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportProjectToJSON } from '../jsonExportUtils';
import type { Project, Requirement, UseCase, TestCase, Information } from '../../types';
import { diskLinkService } from '../../services/diskLinkService';

// Mock diskLinkService
vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getLinksForProject: vi.fn(),
  },
}));

// Mock window.showSaveFilePicker
const mockShowSaveFilePicker = vi.fn();
const mockCreateWritable = vi.fn();
const mockWrite = vi.fn();
const mockClose = vi.fn();

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

// Mock document.createElement
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

describe('jsonExportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks
    (window as any).showSaveFilePicker = mockShowSaveFilePicker;
    mockShowSaveFilePicker.mockResolvedValue({
      createWritable: mockCreateWritable,
    });
    mockCreateWritable.mockResolvedValue({
      write: mockWrite,
      close: mockClose,
    });

    (globalThis as any).URL.createObjectURL = mockCreateObjectURL;
    (globalThis as any).URL.revokeObjectURL = mockRevokeObjectURL;

    document.createElement = mockCreateElement;
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    });

    // Mock diskLinkService
    vi.mocked(diskLinkService.getLinksForProject).mockResolvedValue([]);
  });

  const mockProject: Project = {
    id: 'p1',
    name: 'Test Project',
    description: 'Test Description',
    requirementIds: ['r1'],
    useCaseIds: ['u1'],
    testCaseIds: ['t1'],
    informationIds: ['i1'],
    lastModified: 0,
    currentBaseline: 'Baseline 1.0',
    riskIds: [],
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
    // Links are now stored in linkedArtifacts
    linkedArtifacts: [
      { targetId: 'u1', type: 'related_to' },
      { targetId: 'external-id', type: 'depends_on' },
    ],
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
    content: 'Info Content',
    type: 'note',
    lastModified: 0,
    revision: '01',
    dateCreated: 0,
  };

  const globalState = {
    requirements: [mockReq, { ...mockReq, id: 'r2', linkedArtifacts: [] }], // r2 not in project
    useCases: [mockUseCase],
    testCases: [mockTestCase],
    information: [mockInfo],
    // Note: links are no longer a separate array, they're in each artifact's linkedArtifacts
  };

  it('should export filtered data correctly', async () => {
    await exportProjectToJSON(mockProject, globalState, ['r1'], ['u1'], ['t1'], ['i1']);

    expect(mockWrite).toHaveBeenCalled();
    const callArg = mockWrite.mock.calls[0][0];

    // The write call receives a Blob, we need to read it
    expect(callArg).toBeInstanceOf(Blob);

    // Read Blob using FileReader (available in test environment)
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(callArg);
    });

    const data = JSON.parse(text);

    expect(data.project.id).toBe('p1');
    expect(data.requirements).toHaveLength(1);
    expect(data.requirements[0].id).toBe('r1');
    // Links are now in each artifact's linkedArtifacts, not a separate array
    expect(data.requirements[0].linkedArtifacts).toHaveLength(2);
    expect(data.requirements[0].linkedArtifacts[0].targetId).toBe('u1');
    // Links are now exported as a separate array from diskLinkService
    expect(data.links).toBeDefined();
    expect(Array.isArray(data.links)).toBe(true);
  });

  it('should use showSaveFilePicker if available', async () => {
    await exportProjectToJSON(mockProject, globalState, ['r1'], [], [], []);

    expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
      suggestedName: 'Test_Project_Baseline_1_0.json',
      types: [
        {
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
    expect(mockWrite).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should fallback to download if showSaveFilePicker is not available', async () => {
    delete (window as any).showSaveFilePicker;

    await exportProjectToJSON(mockProject, globalState, ['r1'], [], [], []);

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
  });
});
