/**
 * Export Completeness Tests
 *
 * These tests ensure that all exportable artifact types are included in the export utilities.
 * If a new artifact type is added but not included in exports, these tests will fail.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the canonical list of exportable artifact types
// These are the data types that should be included in PDF, Excel, and JSON exports
const EXPORTABLE_ARTIFACT_TYPES = [
  'requirement',
  'usecase',
  'testcase',
  'information',
  'risk',
  'link',
] as const;

// Sheet names that should be present in Excel exports for each artifact type
const EXCEL_SHEET_NAMES: Record<string, string> = {
  requirement: 'Requirements',
  usecase: 'Use Cases',
  testcase: 'Test Cases',
  information: 'Information',
  risk: 'Risks',
  link: 'Links',
};

// Section function names in PDF export for each artifact type
const PDF_SECTION_FUNCTIONS: Record<string, string> = {
  requirement: 'addRequirementsSection',
  usecase: 'addUseCasesSection',
  testcase: 'addTestCasesSection',
  information: 'addInformationSection',
  risk: 'addRisksSection',
  link: 'addLinksSection',
};

describe('Export Completeness', () => {
  const excelExportPath = resolve(__dirname, '../excelExportUtils.ts');
  const pdfExportPath = resolve(__dirname, '../pdfExportUtils.ts');
  const jsonExportPath = resolve(__dirname, '../jsonExportUtils.ts');

  describe('Excel Export includes all artifact types', () => {
    let excelExportCode: string;

    beforeAll(() => {
      excelExportCode = readFileSync(excelExportPath, 'utf-8');
    });

    it.each(EXPORTABLE_ARTIFACT_TYPES)('should include %s in Excel export', (artifactType) => {
      const expectedSheetName = EXCEL_SHEET_NAMES[artifactType];

      // Check that the sheet is appended
      const sheetPattern = new RegExp(
        `book_append_sheet\\([^,]+,\\s*[^,]+,\\s*['"]${expectedSheetName}['"]\\)`,
        'i'
      );
      expect(excelExportCode).toMatch(sheetPattern);
    });

    it('should have sheet names defined for all exportable types', () => {
      for (const type of EXPORTABLE_ARTIFACT_TYPES) {
        expect(EXCEL_SHEET_NAMES[type]).toBeDefined();
      }
    });
  });

  describe('PDF Export includes all artifact types', () => {
    let pdfExportCode: string;

    beforeAll(() => {
      pdfExportCode = readFileSync(pdfExportPath, 'utf-8');
    });

    it.each(EXPORTABLE_ARTIFACT_TYPES)('should include %s in PDF export', (artifactType) => {
      const expectedFunction = PDF_SECTION_FUNCTIONS[artifactType];

      // Check that the section function is called in the main export function
      expect(pdfExportCode).toContain(expectedFunction);
    });

    it('should have section functions defined for all exportable types', () => {
      for (const type of EXPORTABLE_ARTIFACT_TYPES) {
        expect(PDF_SECTION_FUNCTIONS[type]).toBeDefined();
      }
    });
  });

  describe('JSON Export includes all artifact types', () => {
    let jsonExportCode: string;

    beforeAll(() => {
      jsonExportCode = readFileSync(jsonExportPath, 'utf-8');
    });

    it('should include requirements in JSON export', () => {
      expect(jsonExportCode).toContain('requirements');
    });

    it('should include useCases in JSON export', () => {
      expect(jsonExportCode).toContain('useCases');
    });

    it('should include testCases in JSON export', () => {
      expect(jsonExportCode).toContain('testCases');
    });

    it('should include information in JSON export', () => {
      expect(jsonExportCode).toContain('information');
    });

    it('should include risks in JSON export', () => {
      expect(jsonExportCode).toContain('risks');
    });

    it('should include links in JSON export', () => {
      expect(jsonExportCode).toContain('links');
    });
  });

  describe('Traceability Matrix includes all artifact types', () => {
    let excelExportCode: string;

    beforeAll(() => {
      excelExportCode = readFileSync(excelExportPath, 'utf-8');
    });

    it('should include Requirements in traceability matrix', () => {
      // Check that projectRequirements is mapped into allArtifactIds
      expect(excelExportCode).toMatch(/projectRequirements\.map/);
    });

    it('should include Use Cases in traceability matrix', () => {
      expect(excelExportCode).toMatch(/projectUseCases\.map/);
    });

    it('should include Test Cases in traceability matrix', () => {
      expect(excelExportCode).toMatch(/projectTestCases\.map/);
    });

    it('should include Information in traceability matrix', () => {
      expect(excelExportCode).toMatch(/projectInformation\.map/);
    });

    it('should include Risks in traceability matrix', () => {
      expect(excelExportCode).toMatch(/projectRisks\.map/);
    });
  });

  describe('Revision History includes all artifact types', () => {
    let excelExportCode: string;

    beforeAll(() => {
      excelExportCode = readFileSync(excelExportPath, 'utf-8');
    });

    it('should fetch history for requirements', () => {
      expect(excelExportCode).toMatch(/fetchHistory\(['"]requirements['"]/);
    });

    it('should fetch history for usecases', () => {
      expect(excelExportCode).toMatch(/fetchHistory\(['"]usecases['"]/);
    });

    it('should fetch history for testcases', () => {
      expect(excelExportCode).toMatch(/fetchHistory\(['"]testcases['"]/);
    });

    it('should fetch history for information', () => {
      expect(excelExportCode).toMatch(/fetchHistory\(['"]information['"]/);
    });

    it('should fetch history for risks', () => {
      expect(excelExportCode).toMatch(/fetchHistory\(['"]risks['"]/);
    });
  });
});
