import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportProjectToPDF } from '../pdfExportUtils';
import type { Project, Requirement, UseCase, TestCase, Information } from '../../types';

// Mock jsPDF
const mockText = vi.fn();
const mockAddPage = vi.fn();
const mockSetPage = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSave = vi.fn();
const mockSplitTextToSize = vi.fn((text) => [text]);
const mockGetTextWidth = vi.fn(() => 10);
const mockInternal = {
    pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
    }
};

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
                    output: vi.fn()
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

describe('pdfExportUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate granular Table of Contents with artifacts', async () => {
        const mockProject: Project = {
            id: 'p1',
            name: 'Test Project',
            description: 'Desc',
            requirementIds: ['r1'],
            useCaseIds: ['u1'],
            testCaseIds: [],
            informationIds: [],
            lastModified: 0,
            currentBaseline: undefined
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
            mainFlow: 'Flow',
            priority: 'medium',
            status: 'draft',
            lastModified: 0,
            revision: '01'
        };

        const globalState = {
            requirements: [mockReq],
            useCases: [mockUseCase],
            testCases: [],
            information: []
        };

        await exportProjectToPDF(
            mockProject,
            globalState,
            ['r1'],
            ['u1'],
            [],
            []
        );

        // Verify TOC generation
        // We expect calls to doc.text with TOC entries

        // 1. "Table of Contents" header
        expect(mockText).toHaveBeenCalledWith('Table of Contents', 20, 20);

        // 2. Main Sections
        expect(mockText).toHaveBeenCalledWith('Requirements', expect.any(Number), expect.any(Number));
        expect(mockText).toHaveBeenCalledWith('Use Cases', expect.any(Number), expect.any(Number));

        // 3. Granular Artifacts (indented)
        // The indentation is handled by x-coordinate calculation in addTableOfContents
        // Requirements are level 0, artifacts level 1.
        // Level 0 indent = 0, x = 25
        // Level 1 indent = 10, x = 35

        expect(mockText).toHaveBeenCalledWith('r1 - My Requirement', 35, expect.any(Number));
        expect(mockText).toHaveBeenCalledWith('u1 - My Use Case', 35, expect.any(Number));
    });
});
