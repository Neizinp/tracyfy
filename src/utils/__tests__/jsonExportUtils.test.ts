import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportProjectToJSON } from '../jsonExportUtils';
import type { Project, Requirement, UseCase, TestCase, Information, Link } from '../../types';

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
  };

  const mockReq: Requirement = {
    id: 'r1',
    title: 'My Requirement',
    description: 'Desc',
    text: 'Req text',
    rationale: 'Rationale',
    status: 'draft',
    priority: 'high',
    parentIds: [],
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
    content: 'Info Content',
    type: 'note',
    lastModified: 0,
    revision: '01',
    dateCreated: 0,
  };

  const mockLink1: Link = {
    id: 'link1',
    sourceId: 'r1',
    targetId: 'u1',
    type: 'relates_to',
  };

  const mockLink2: Link = {
    id: 'link2',
    sourceId: 'r1',
    targetId: 'external-id', // Should be included because r1 is included
    type: 'depends_on',
  };

  const mockLink3: Link = {
    id: 'link3',
    sourceId: 'external-id-1',
    targetId: 'external-id-2', // Should be excluded
    type: 'conflicts_with',
  };

  const globalState = {
    requirements: [mockReq, { ...mockReq, id: 'r2' }], // r2 not in project
    useCases: [mockUseCase],
    testCases: [mockTestCase],
    information: [mockInfo],
    links: [mockLink1, mockLink2, mockLink3],
  };

  it('should export filtered data correctly', async () => {
    await exportProjectToJSON(mockProject, globalState, ['r1'], ['u1'], ['t1'], ['i1']);

    expect(mockWrite).toHaveBeenCalled();
    const callArg = mockWrite.mock.calls[0][0];

    // The write call receives a Blob, we need to read it
    // In tests, we can extract the contents from the Blob constructor call
    // But Blob is already constructed. Let's capture what was written.
    // Since we're writing a Blob, we can read its content using FileReader or text() in modern environments
    // But in test env, Blob.text() might not exist. Let's spy on Blob constructor instead.

    // Alternative: Check the mock calls to write and verify the structure
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
    expect(data.links).toHaveLength(2); // mockLink1 and mockLink2
    expect(data.links).toContainEqual(mockLink1);
    expect(data.links).toContainEqual(mockLink2);
    expect(data.links).not.toContainEqual(mockLink3);
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
    // Check filename assignment (mocked element)
    // Since we mocked createElement to return an object, we can't easily check the property assignment unless we spy on the object returned.
    // But we can check if download attribute was set if we kept a reference.
    // The mockCreateElement returns a new object each time or the same one?
    // In beforeEach: mockCreateElement.mockReturnValue({...}) -> returns same object reference if defined outside, or new if defined inside.
    // It returns a new object literal each time in the current setup? No, mockReturnValue returns the SAME value every time.

    // Let's improve the mock to capture the element
    // Actually, the current test setup might not capture the property assignment on the returned object.
    // But we can verify the flow.
  });
});
