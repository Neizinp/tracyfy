import type { jsPDF } from 'jspdf';
import type {
  ArtifactDocument,
  DocumentEntry,
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
} from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import {
  renderRequirement,
  renderUseCase,
  renderTestCase,
  renderInformation,
  renderRisk,
} from './pdfArtifactRenderer';

interface ExportContext {
  doc: jsPDF;
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks: Risk[];
  customAttributeDefinitions: CustomAttributeDefinition[];
  tocEntries: { title: string; page: number; level: number }[];
}

/**
 * Adds the Documents section to the PDF
 */
export async function addDocumentsSection(
  context: ExportContext,
  documents: ArtifactDocument[],
  startSectionNumber: number
): Promise<number> {
  let page = context.doc.internal.pages.length - 1;
  let sectionNumber = startSectionNumber;

  for (const doc of documents) {
    if (doc.isDeleted) continue;

    context.doc.addPage();
    page++;

    context.doc.setFontSize(18);
    context.doc.setFont('helvetica', 'bold');
    const docTitle = `${sectionNumber}. Document: ${doc.title}`;
    context.doc.text(docTitle, 20, 20);
    context.tocEntries.push({ title: docTitle, page: page, level: 0 });

    const yPos = 35;

    // Start numbering with the section number
    const numberingBase = [sectionNumber];

    page = await renderFlatStructure(context, doc.structure, yPos, page, numberingBase);

    sectionNumber++;
  }

  return page;
}

/**
 * Renders a flat document structure with hierarchical numbering
 */
export async function renderFlatStructure(
  context: ExportContext,
  structure: DocumentEntry[],
  initialYPos: number,
  initialPage: number,
  numberingBase: number[]
): Promise<number> {
  const { doc, requirements, useCases, testCases, information, risks, customAttributeDefinitions } =
    context;

  let yPos = initialYPos;
  let page = initialPage;
  let numberingStack = [...numberingBase];

  for (const entry of structure) {
    if (entry.type === 'heading') {
      const level = entry.level || 1;

      // Adjust stack to match level
      // Level 1 means stack should have 2 elements: [base, index]
      // Level 2 means stack should have 3 elements: [base, index, index]
      if (numberingStack.length < level + 1) {
        while (numberingStack.length < level + 1) {
          numberingStack.push(1);
        }
      } else if (numberingStack.length > level + 1) {
        numberingStack = numberingStack.slice(0, level + 1);
        numberingStack[numberingStack.length - 1]++;
      } else {
        numberingStack[numberingStack.length - 1]++;
      }

      const numberingStr = numberingStack.join('.');

      // Check for page break
      if (yPos > 250) {
        doc.addPage();
        page++;
        yPos = 20;
      }

      // Set font size based on level (H1=14, H2=12, H3=11)
      const fontSize = Math.max(11, 16 - level * 2);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');

      const headingText = `${numberingStr} ${entry.title || ''}`;
      doc.text(headingText, 20, yPos);

      // Add to TOC
      context.tocEntries.push({ title: headingText, page: page, level: level });

      yPos += fontSize / 2 + 5;
    } else {
      // It's an artifact reference
      const artifactId = entry.id;
      const artifactType = entry.artifactType;
      if (!artifactId || !artifactType) continue;

      // Find the artifact and render it
      let result;
      if (artifactType === 'requirements') {
        const req = requirements.find((r) => r.id === artifactId);
        if (req) {
          result = await renderRequirement(doc, req, yPos, page, customAttributeDefinitions);
        }
      } else if (artifactType === 'useCases') {
        const uc = useCases.find((u) => u.id === artifactId);
        if (uc) {
          result = await renderUseCase(doc, uc, yPos, page, customAttributeDefinitions);
        }
      } else if (artifactType === 'testCases') {
        const tc = testCases.find((t) => t.id === artifactId);
        if (tc) {
          result = await renderTestCase(doc, tc, yPos, page, customAttributeDefinitions);
        }
      } else if (artifactType === 'information') {
        const info = information.find((i) => i.id === artifactId);
        if (info) {
          result = await renderInformation(doc, info, yPos, page, customAttributeDefinitions);
        }
      } else if (artifactType === 'risks') {
        const risk = risks.find((r) => r.id === artifactId);
        if (risk) {
          result = await renderRisk(doc, risk, yPos, page);
        }
      }

      if (result) {
        yPos = result.yPos;
        page = result.page;
      }
    }
  }

  return page;
}
