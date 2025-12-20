/**
 * PDF Artifact Renderer
 *
 * Centralized logic for rendering individual artifacts (Requirements, Use Cases, etc.)
 * for PDF export. Used by both project section exports and document exports.
 */

import jsPDF from 'jspdf';
import type { Requirement, UseCase, TestCase, Information, Risk } from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import { formatDate } from '../dateUtils';
import { formatCustomAttributeValue } from './pdfCoreUtils';
import { addImagesFromMarkdown } from './pdfImageUtils';

export interface RenderResult {
  yPos: number;
  page: number;
}

/**
 * Render a single Requirement
 */
export async function renderRequirement(
  doc: jsPDF,
  req: Requirement,
  yPos: number,
  page: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<RenderResult> {
  const boxLeft = 15;
  const boxWidth = 180;
  let boxTop = yPos;
  let currentY = boxTop;

  // Check if we need a new page (need ~60mm minimum for header + some content)
  if (yPos > 230) {
    doc.addPage();
    page++;
    yPos = 20;
    boxTop = 20;
    currentY = 20;
  }

  // Draw outer box border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);

  // Header section with shaded background
  const headerHeight = 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

  // Requirement ID and Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const title = `${req.id} - ${req.title}`;
  doc.text(title, boxLeft + 3, currentY + 7);

  // Revision (right-aligned)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const revText = `Rev: ${req.revision || '01'}`;
  doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

  currentY += headerHeight;

  // Metadata bar (Status | Priority | Author)
  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const metadataText = `Status: ${req.status}  |  Priority: ${req.priority}  |  Author: ${req.author || 'N/A'}`;
  doc.text(metadataText, boxLeft + 3, currentY + 4);
  currentY += 6;

  // Content sections
  const contentLeft = boxLeft + 3;
  const contentWidth = boxWidth - 6;
  currentY += 3;

  // Description
  if (req.description) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(req.description, contentWidth);
    doc.text(descLines, contentLeft, currentY);
    currentY += descLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      req.description,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Requirement Text
  if (req.text) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Requirement Text:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const textLines = doc.splitTextToSize(req.text, contentWidth);
    doc.text(textLines, contentLeft, currentY);
    currentY += textLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      req.text,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Rationale
  if (req.rationale) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Rationale:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const rationaleLines = doc.splitTextToSize(req.rationale, contentWidth);
    doc.text(rationaleLines, contentLeft, currentY);
    currentY += rationaleLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      req.rationale,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Comments
  if (req.comments) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Comments:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const commentsLines = doc.splitTextToSize(req.comments, contentWidth);
    doc.text(commentsLines, contentLeft, currentY);
    currentY += commentsLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      req.comments,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Custom Attributes
  if (req.customAttributes && req.customAttributes.length > 0) {
    const formattedAttrs = req.customAttributes
      .map((attr) => formatCustomAttributeValue(attr, customAttributeDefinitions))
      .filter((x): x is { name: string; displayValue: string } => x !== null);

    if (formattedAttrs.length > 0) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Custom Attributes:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      for (const attr of formattedAttrs) {
        doc.text(`${attr.name}: ${attr.displayValue}`, contentLeft, currentY);
        currentY += 4;
      }
      currentY += 2;
    }
  }

  // Footer metadata bar
  currentY += 1;
  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerText = `Verification: ${req.verificationMethod || 'N/A'}  |  Created: ${formatDate(req.dateCreated)}  |  Modified: ${formatDate(req.lastModified)}  |  Approved: ${req.approvalDate ? formatDate(req.approvalDate) : 'N/A'}`;
  doc.text(footerText, boxLeft + 3, currentY + 4);
  currentY += 6;

  // Draw final box border
  doc.setDrawColor(200, 200, 200);
  doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

  return { yPos: currentY + 5, page };
}

/**
 * Render a single Use Case
 */
export async function renderUseCase(
  doc: jsPDF,
  useCase: UseCase,
  yPos: number,
  page: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<RenderResult> {
  const boxLeft = 15;
  const boxWidth = 180;
  let boxTop = yPos;
  let currentY = boxTop;

  if (yPos > 230) {
    doc.addPage();
    page++;
    yPos = 20;
    boxTop = 20;
    currentY = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);

  const headerHeight = 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const title = `${useCase.id} - ${useCase.title}`;
  doc.text(title, boxLeft + 3, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const revText = `Rev: ${useCase.revision || '01'}`;
  doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

  currentY += headerHeight;

  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const metadataText = `Status: ${useCase.status}  |  Priority: ${useCase.priority}  |  Actor: ${useCase.actor || 'N/A'}`;
  doc.text(metadataText, boxLeft + 3, currentY + 4);
  currentY += 6;

  const contentLeft = boxLeft + 3;
  const contentWidth = boxWidth - 6;
  currentY += 3;

  // Description
  if (useCase.description) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(useCase.description, contentWidth);
    doc.text(descLines, contentLeft, currentY);
    currentY += descLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      useCase.description,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Preconditions
  if (useCase.preconditions) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Preconditions:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const preLines = doc.splitTextToSize(useCase.preconditions, contentWidth);
    doc.text(preLines, contentLeft, currentY);
    currentY += preLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      useCase.preconditions,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Main Flow
  if (useCase.mainFlow) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Main Flow:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const flowLines = doc.splitTextToSize(useCase.mainFlow, contentWidth);
    doc.text(flowLines, contentLeft, currentY);
    currentY += flowLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      useCase.mainFlow,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Alternative Flows
  if (useCase.alternativeFlows) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Alternative Flows:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const altLines = doc.splitTextToSize(useCase.alternativeFlows, contentWidth);
    doc.text(altLines, contentLeft, currentY);
    currentY += altLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      useCase.alternativeFlows,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Postconditions
  if (useCase.postconditions) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Postconditions:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const postLines = doc.splitTextToSize(useCase.postconditions, contentWidth);
    doc.text(postLines, contentLeft, currentY);
    currentY += postLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      useCase.postconditions,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Custom Attributes
  if (useCase.customAttributes && useCase.customAttributes.length > 0) {
    const formattedAttrs = useCase.customAttributes
      .map((attr) => formatCustomAttributeValue(attr, customAttributeDefinitions))
      .filter((x): x is { name: string; displayValue: string } => x !== null);

    if (formattedAttrs.length > 0) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Custom Attributes:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      for (const attr of formattedAttrs) {
        doc.text(`${attr.name}: ${attr.displayValue}`, contentLeft, currentY);
        currentY += 4;
      }
      currentY += 2;
    }
  }

  // Footer
  currentY += 1;
  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerText = `Modified: ${formatDate(useCase.lastModified)}`;
  doc.text(footerText, boxLeft + 3, currentY + 4);
  currentY += 6;

  doc.setDrawColor(200, 200, 200);
  doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

  return { yPos: currentY + 5, page };
}

/**
 * Render a single Test Case
 */
export async function renderTestCase(
  doc: jsPDF,
  testCase: TestCase,
  yPos: number,
  page: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<RenderResult> {
  const boxLeft = 15;
  const boxWidth = 180;
  let boxTop = yPos;
  let currentY = boxTop;

  if (yPos > 230) {
    doc.addPage();
    page++;
    yPos = 20;
    boxTop = 20;
    currentY = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);

  const headerHeight = 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const title = `${testCase.id} - ${testCase.title}`;
  doc.text(title, boxLeft + 3, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const revText = `Rev: ${testCase.revision || '01'}`;
  doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

  currentY += headerHeight;

  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const metadataText = `Status: ${testCase.status}  |  Priority: ${testCase.priority}  |  Author: ${testCase.author || 'N/A'}`;
  doc.text(metadataText, boxLeft + 3, currentY + 4);
  currentY += 6;

  const contentLeft = boxLeft + 3;
  const contentWidth = boxWidth - 6;
  currentY += 3;

  // Description
  if (testCase.description) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(testCase.description, contentWidth);
    doc.text(descLines, contentLeft, currentY);
    currentY += descLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      testCase.description,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Tests Requirements
  if (testCase.requirementIds && testCase.requirementIds.length > 0) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Tests Requirements:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(testCase.requirementIds.join(', '), contentLeft, currentY);
    currentY += 7;
  }

  // Custom Attributes
  if (testCase.customAttributes && testCase.customAttributes.length > 0) {
    const formattedAttrs = testCase.customAttributes
      .map((attr) => formatCustomAttributeValue(attr, customAttributeDefinitions))
      .filter((x): x is { name: string; displayValue: string } => x !== null);

    if (formattedAttrs.length > 0) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Custom Attributes:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      for (const attr of formattedAttrs) {
        doc.text(`${attr.name}: ${attr.displayValue}`, contentLeft, currentY);
        currentY += 4;
      }
      currentY += 2;
    }
  }

  // Footer
  currentY += 1;
  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerText = `Created: ${formatDate(testCase.dateCreated)}  |  Modified: ${formatDate(testCase.lastModified)}  |  Last Run: ${testCase.lastRun ? formatDate(testCase.lastRun) : 'Never'}`;
  doc.text(footerText, boxLeft + 3, currentY + 4);
  currentY += 6;

  doc.setDrawColor(200, 200, 200);
  doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

  return { yPos: currentY + 5, page };
}

/**
 * Render a single Information
 */
export async function renderInformation(
  doc: jsPDF,
  info: Information,
  yPos: number,
  page: number,
  customAttributeDefinitions: CustomAttributeDefinition[]
): Promise<RenderResult> {
  const boxLeft = 15;
  const boxWidth = 180;
  let boxTop = yPos;
  let currentY = boxTop;

  if (yPos > 230) {
    doc.addPage();
    page++;
    yPos = 20;
    boxTop = 20;
    currentY = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);

  const headerHeight = 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const title = `${info.id} - ${info.title}`;
  doc.text(title, boxLeft + 3, currentY + 7);

  currentY += headerHeight;

  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const typeValue = info.type || 'information';
  const typeStr = typeValue.charAt(0).toUpperCase() + typeValue.slice(1);
  const metadataText = `Type: ${typeStr}`;
  doc.text(metadataText, boxLeft + 3, currentY + 4);
  currentY += 6;

  const contentLeft = boxLeft + 3;
  const contentWidth = boxWidth - 6;
  currentY += 3;

  // Content
  if (info.text) {
    if (currentY > 260) {
      doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
      doc.addPage();
      page++;
      currentY = 20;
      boxTop = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const contentLines = doc.splitTextToSize(info.text, contentWidth);
    doc.text(contentLines, contentLeft, currentY);
    currentY += contentLines.length * 4 + 3;

    const pageRef = { page };
    currentY = await addImagesFromMarkdown(
      doc,
      info.text,
      currentY,
      contentLeft,
      contentWidth,
      pageRef
    );
    page = pageRef.page;
  }

  // Custom Attributes
  if (info.customAttributes && info.customAttributes.length > 0) {
    const formattedAttrs = info.customAttributes
      .map((attr) => formatCustomAttributeValue(attr, customAttributeDefinitions))
      .filter((x): x is { name: string; displayValue: string } => x !== null);

    if (formattedAttrs.length > 0) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Custom Attributes:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      for (const attr of formattedAttrs) {
        doc.text(`${attr.name}: ${attr.displayValue}`, contentLeft, currentY);
        currentY += 4;
      }
      currentY += 2;
    }
  }

  // Footer
  currentY += 1;
  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerText = `Modified: ${formatDate(info.lastModified)}`;
  doc.text(footerText, boxLeft + 3, currentY + 4);
  currentY += 6;

  doc.setDrawColor(200, 200, 200);
  doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

  return { yPos: currentY + 5, page };
}

/**
 * Render a single Risk
 */
export async function renderRisk(
  doc: jsPDF,
  risk: Risk,
  yPos: number,
  page: number
): Promise<RenderResult> {
  const boxLeft = 15;
  const boxWidth = 180;
  let boxTop = yPos;
  let currentY = boxTop;

  const capitalizeWord = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (yPos > 230) {
    doc.addPage();
    page++;
    yPos = 20;
    boxTop = 20;
    currentY = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);

  const headerHeight = 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const title = `${risk.id} - ${risk.title}`;
  doc.text(title, boxLeft + 3, currentY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const revText = `Rev: ${risk.revision || '01'}`;
  doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

  currentY += headerHeight;

  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const metadataText = `Category: ${capitalizeWord(risk.category || 'other')}  |  Probability: ${capitalizeWord(risk.probability || 'medium')}  |  Impact: ${capitalizeWord(risk.impact || 'medium')}  |  Status: ${capitalizeWord(risk.status || 'open')}`;
  doc.text(metadataText, boxLeft + 3, currentY + 4);
  currentY += 6;

  const contentLeft = boxLeft + 3;
  const contentWidth = boxWidth - 6;
  currentY += 3;

  // Description
  if (risk.description) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(risk.description, contentWidth);
    doc.text(descLines, contentLeft, currentY);
    currentY += descLines.length * 4 + 3;
  }

  // Mitigation
  if (risk.mitigation) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Mitigation Strategy:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const mitigationLines = doc.splitTextToSize(risk.mitigation, contentWidth);
    doc.text(mitigationLines, contentLeft, currentY);
    currentY += mitigationLines.length * 4 + 3;
  }

  // Contingency
  if (risk.contingency) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Contingency Plan:', contentLeft, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const contingencyLines = doc.splitTextToSize(risk.contingency, contentWidth);
    doc.text(contingencyLines, contentLeft, currentY);
    currentY += contingencyLines.length * 4 + 3;
  }

  // Footer metadata bar
  currentY += 1;
  doc.setFillColor(250, 250, 250);
  doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const footerText = `Owner: ${risk.owner || 'N/A'}  |  Created: ${formatDate(risk.dateCreated)}  |  Modified: ${formatDate(risk.lastModified)}`;
  doc.text(footerText, boxLeft + 3, currentY + 4);
  currentY += 6;

  doc.setDrawColor(200, 200, 200);
  doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

  return { yPos: currentY + 5, page };
}
