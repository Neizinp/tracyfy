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
const mockInternal = {
    pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
    }
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
                    internal: mockInternal,
                    getNumberOfPages: () => 5,
                    output: mockOutput
                };
            }
        }
    };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
    default: vi.fn((doc, options) => {
        // Simulate table adding height
        doc.lastAutoTable = { finalY: (options.startY || 20) + 20 };
    })
}));

// Mock gitService
vi.mock('../../services/gitService', () => ({
    gitService: {
        getArtifactHistory: vi.fn().mockResolvedValue([])
    }
}));

describe('pdfExportUtils', () => {
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
        lastModified: 0,
        currentBaseline: 'Baseline 1.0'
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
        dateCreated: 0
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
        revision: '01'
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
        requirementIds: []
    };

    const mockInfo: Information = {
        id: 'i1',
        title: 'My Info',
        content: 'Info Content',
        type: 'note',
        lastModified: 0,
        revision: '01',
        dateCreated: 0
    };

    const globalState = {
        requirements: [mockReq],
        useCases: [mockUseCase],
        testCases: [mockTestCase],
        information: [mockInfo]
    };

    it('should generate Cover Page with correct details', async () => {
        // Mock showSaveFilePicker to avoid error
        (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
                write: vi.fn(),
                close: vi.fn()
            })
        });

        await exportProjectToPDF(
            mockProject,
            globalState,
            ['r1'],
            ['u1'],
            ['t1'],
            ['i1'],
            []
        );

        // Verify Title
        expect(mockText).toHaveBeenCalledWith('Test Project', 105, 60, { align: 'center' });

        // Verify Description
        expect(mockText).toHaveBeenCalledWith(['Test Description'], 105, 95, { align: 'center', maxWidth: 170 });

        // Verify Date (YYYY-MM-DD)
        const expectedDate = formatDate(Date.now());
        expect(mockText).toHaveBeenCalledWith(expect.stringContaining(`Export Date: ${expectedDate}`), 105, 140, { align: 'center' });

        // Verify Baseline
        expect(mockText).toHaveBeenCalledWith('Baseline: Baseline 1.0', 105, 155, { align: 'center' });
    });

    it('should generate granular Table of Contents', async () => {
        (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
                write: vi.fn(),
                close: vi.fn()
            })
        });

        await exportProjectToPDF(
            mockProject,
            globalState,
            ['r1'],
            ['u1'],
            ['t1'],
            ['i1'],
            []
        );

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
                close: vi.fn()
            })
        });

        await exportProjectToPDF(
            mockProject,
            globalState,
            ['r1'],
            ['u1'],
            ['t1'],
            ['i1'],
            []
        );

        // Requirements Section
        expect(mockText).toHaveBeenCalledWith('Requirements', 20, 20);
        expect(mockText).toHaveBeenCalledWith('r1 - My Requirement', 20, 30);
        expect(mockText).toHaveBeenCalledWith('Requirement Text:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Req text'], 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith('Rationale:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Rationale'], 20, expect.any(Number));

        // Use Cases Section
        expect(mockText).toHaveBeenCalledWith('Use Cases', 20, 20);
        expect(mockText).toHaveBeenCalledWith('u1 - My Use Case', 20, 30);
        expect(mockText).toHaveBeenCalledWith('Main Flow:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Step 1. Do this.'], 20, expect.any(Number));

        // Test Cases Section
        expect(mockText).toHaveBeenCalledWith('Test Cases', 20, 20);
        expect(mockText).toHaveBeenCalledWith('t1 - My Test Case', 20, 30);
        expect(mockText).toHaveBeenCalledWith('Description:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Test Steps'], 20, expect.any(Number));

        // Information Section
        expect(mockText).toHaveBeenCalledWith('Information', 20, 20);
        expect(mockText).toHaveBeenCalledWith('i1 - My Info', 20, 30);
        expect(mockText).toHaveBeenCalledWith(['Info Content'], 20, expect.any(Number));
    });

    it('should fallback to doc.save if showSaveFilePicker is not available', async () => {
        delete (window as any).showSaveFilePicker;

        await exportProjectToPDF(
            mockProject,
            globalState,
            ['r1'],
            [],
            [],
            [],
            []
        );

        expect(mockSave).toHaveBeenCalledWith('Test_Project-export.pdf');
    });

    it('should export all requirement attributes', async () => {
        (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
                write: vi.fn(),
                close: vi.fn()
            })
        });

        const fullReq: Requirement = {
            ...mockReq,
            description: 'Full description text',
            author: 'John Doe',
            verificationMethod: 'Test',
            comments: 'Some comments here',
            approvalDate: 1234567890000
        };

        await exportProjectToPDF(
            mockProject,
            { ...globalState, requirements: [fullReq] },
            ['r1'],
            [],
            [],
            [],
            []
        );

        // Verify Description section
        expect(mockText).toHaveBeenCalledWith('Description:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Full description text'], 20, expect.any(Number));

        // Verify Comments section
        expect(mockText).toHaveBeenCalledWith('Comments:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Some comments here'], 20, expect.any(Number));
    });

    it('should export all use case attributes', async () => {
        (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
                write: vi.fn(),
                close: vi.fn()
            })
        });

        const fullUseCase: UseCase = {
            ...mockUseCase,
            preconditions: 'User must be logged in',
            postconditions: 'Data is saved',
            alternativeFlows: 'Alternative path description'
        };

        await exportProjectToPDF(
            mockProject,
            { ...globalState, useCases: [fullUseCase] },
            [],
            ['u1'],
            [],
            [],
            []
        );

        // Verify Preconditions section
        expect(mockText).toHaveBeenCalledWith('Preconditions:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['User must be logged in'], 20, expect.any(Number));

        // Verify Postconditions section
        expect(mockText).toHaveBeenCalledWith('Postconditions:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Data is saved'], 20, expect.any(Number));

        // Verify Alternative Flows section
        expect(mockText).toHaveBeenCalledWith('Alternative Flows:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith(['Alternative path description'], 20, expect.any(Number));
    });

    it('should export all test case attributes', async () => {
        (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
                write: vi.fn(),
                close: vi.fn()
            })
        });

        const fullTestCase: TestCase = {
            ...mockTestCase,
            author: 'Jane Smith',
            lastRun: 1234567890000,
            requirementIds: ['r1', 'r2']
        };

        await exportProjectToPDF(
            mockProject,
            { ...globalState, testCases: [fullTestCase] },
            [],
            [],
            ['t1'],
            [],
            []
        );

        // Verify Tests Requirements section (traceability)
        expect(mockText).toHaveBeenCalledWith('Tests Requirements:', 20, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith('r1, r2', 20, expect.any(Number));
    });

    it('should export all information attributes', async () => {
        (window as any).showSaveFilePicker = vi.fn().mockResolvedValue({
            createWritable: vi.fn().mockResolvedValue({
                write: vi.fn(),
                close: vi.fn()
            })
        });

        const fullInfo: Information = {
            ...mockInfo,
            type: 'meeting'
        };

        await exportProjectToPDF(
            mockProject,
            { ...globalState, information: [fullInfo] },
            [],
            [],
            [],
            ['i1'],
            []
        );

        // Verify Information section is created
        expect(mockText).toHaveBeenCalledWith('Information', 20, 20);
        expect(mockText).toHaveBeenCalledWith('i1 - My Info', 20, 30);
    });
});

