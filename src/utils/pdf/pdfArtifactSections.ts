/**
 * PDF Artifact Sections
 *
 * Generates artifact sections (Requirements, Use Cases, Test Cases, Information) for PDF export.
 */

import jsPDF from 'jspdf';
import type { Requirement, UseCase, TestCase, Information } from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import type { TOCEntry } from './types';
import {
  renderRequirement,
  renderUseCase,
  renderTestCase,
  renderInformation,
} from './pdfArtifactRenderer';

/**
 * Add requirements section to PDF
 */
export async function addRequirementsSection(
  doc: jsPDF,
  requirements: Requirement[],
  startPage: number,
  tocEntries: TOCEntry[],
  sectionNumber: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Requirements`, 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const req of requirements) {
    const result = await renderRequirement(doc, req, yPos, page, customAttributeDefinitions);
    yPos = result.yPos;
    page = result.page;
    tocEntries.push({ title: `${req.id} - ${req.title}`, page: page, level: 1 });
  }

  return page;
}

/**
 * Add use cases section to PDF
 */
export async function addUseCasesSection(
  doc: jsPDF,
  useCases: UseCase[],
  startPage: number,
  tocEntries: TOCEntry[],
  sectionNumber: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Use Cases`, 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const useCase of useCases) {
    const result = await renderUseCase(doc, useCase, yPos, page, customAttributeDefinitions);
    yPos = result.yPos;
    page = result.page;
    tocEntries.push({ title: `${useCase.id} - ${useCase.title}`, page: page, level: 1 });
  }

  return page;
}

/**
 * Add test cases section to PDF
 */
export async function addTestCasesSection(
  doc: jsPDF,
  testCases: TestCase[],
  startPage: number,
  tocEntries: TOCEntry[],
  sectionNumber: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Test Cases`, 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const testCase of testCases) {
    const result = await renderTestCase(doc, testCase, yPos, page, customAttributeDefinitions);
    yPos = result.yPos;
    page = result.page;
    tocEntries.push({ title: `${testCase.id} - ${testCase.title}`, page: page, level: 1 });
  }

  return page;
}

/**
 * Add information section to PDF
 */
export async function addInformationSection(
  doc: jsPDF,
  information: Information[],
  startPage: number,
  tocEntries: TOCEntry[],
  sectionNumber: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Information`, 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const info of information) {
    const result = await renderInformation(doc, info, yPos, page, customAttributeDefinitions);
    yPos = result.yPos;
    page = result.page;
    tocEntries.push({ title: `${info.id} - ${info.title}`, page: page, level: 1 });
  }

  return page;
}
