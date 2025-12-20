import * as XLSX from 'xlsx';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Project,
  ProjectBaseline,
  Risk,
  Link,
} from '../types';
import type { CustomAttributeDefinition, CustomAttributeValue } from '../types/customAttributes';
import { formatDate } from './dateUtils';
import { realGitService } from '../services/realGitService';
import { diskCustomAttributeService } from '../services/diskCustomAttributeService';
import { diskLinkService } from '../services/diskLinkService';
import { LINK_TYPE_LABELS } from './linkTypes';

// Helper to sanitize text for Excel (remove newlines if needed, or keep them)
// Excel handles newlines in cells if wrapText is on.
const sanitize = (text: string | undefined) => text || '';

/**
 * Format a custom attribute value for display in Excel
 */
function formatCustomAttributeValue(
  value: CustomAttributeValue,
  definitions: CustomAttributeDefinition[]
): { name: string; displayValue: string } | null {
  const def = definitions.find((d) => d.id === value.attributeId);
  if (!def) return null;

  let displayValue: string;
  if (value.value === undefined || value.value === null || value.value === '') {
    displayValue = '';
  } else if (def.type === 'checkbox') {
    displayValue = value.value ? 'Yes' : 'No';
  } else if (def.type === 'date' && typeof value.value === 'number') {
    displayValue = formatDate(value.value);
  } else {
    displayValue = String(value.value);
  }

  return { name: def.name, displayValue };
}

/**
 * Add custom attribute columns to an artifact data row
 */
function addCustomAttributeColumns(
  artifact: { customAttributes?: CustomAttributeValue[] },
  definitions: CustomAttributeDefinition[],
  applicableType: string
): Record<string, string> {
  const result: Record<string, string> = {};

  // Get applicable definitions for this artifact type
  const applicableDefs = definitions.filter((d) =>
    (d.appliesTo as string[]).includes(applicableType)
  );

  // Initialize all applicable columns with empty string
  for (const def of applicableDefs) {
    result[def.name] = '';
  }

  // Fill in values that exist
  if (artifact.customAttributes) {
    for (const attrValue of artifact.customAttributes) {
      const formatted = formatCustomAttributeValue(attrValue, definitions);
      if (formatted) {
        result[formatted.name] = formatted.displayValue;
      }
    }
  }

  return result;
}

/**
 * Sort artifacts by their numeric ID suffix (e.g., REQ-001, REQ-002)
 * Extracts the number from IDs like "REQ-001", "UC-002", "TC-003", "INFO-004"
 */
function sortByIdNumber<T extends { id: string }>(artifacts: T[]): T[] {
  return [...artifacts].sort((a, b) => {
    const numA = parseInt(a.id.match(/\d+$/)?.[0] || '0', 10);
    const numB = parseInt(b.id.match(/\d+$/)?.[0] || '0', 10);
    return numA - numB;
  });
}

import type { ExportOptions } from '../types';

export async function exportProjectToExcel(
  project: Project,
  globalState: {
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    risks?: Risk[];
  },
  projectRequirementIds: string[],
  projectUseCaseIds: string[],
  projectTestCaseIds: string[],
  projectInformationIds: string[],
  baselines: ProjectBaseline[],
  options: ExportOptions
): Promise<void> {
  const {
    includeRequirements,
    includeUseCases,
    includeTestCases,
    includeInformation,
    includeRisks,
    includeLinks,
    includeRevisionHistory,
    includeTraceability,
    includeVerificationMatrix,
  } = options;
  // 0. Request File Handle FIRST (to ensure user activation is valid)
  // The File System Access API requires a recent user gesture to show the file picker.
  // If we do async work first, the user activation expires and the picker won't show.
  let fileHandle: FileSystemFileHandle | null = null;
  let defaultFilename = `${project.name.replace(/[^a-z0-9]/gi, '_')}`;
  if (project.currentBaseline) {
    defaultFilename += `_${project.currentBaseline.replace(/[^a-z0-9]/gi, '_')}`;
  }
  defaultFilename += '-export.xlsx';

  try {
    if ('showSaveFilePicker' in window) {
      const picker = (
        window as unknown as {
          showSaveFilePicker: (options: {
            suggestedName: string;
            types: unknown[];
          }) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker;
      fileHandle = await picker({
        suggestedName: defaultFilename,
        types: [
          {
            description: 'Excel Spreadsheet',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            },
          },
        ],
      });
    }
  } catch (err) {
    // If user cancelled, stop export
    if (err instanceof Error && err.name === 'AbortError') {
      return;
    }
    console.error('Error with save file picker:', err);
    // Continue to fallback download
  }

  const wb = XLSX.utils.book_new();

  // Fetch custom attribute definitions for column headers
  const customAttributeDefinitions = await diskCustomAttributeService.getAllDefinitions();

  // Filter artifacts and sort by ID number for consistent ordering
  const projectRequirements = sortByIdNumber(
    globalState.requirements.filter((r) => projectRequirementIds.includes(r.id) && !r.isDeleted)
  );
  const projectUseCases = sortByIdNumber(
    globalState.useCases.filter((u) => projectUseCaseIds.includes(u.id) && !u.isDeleted)
  );
  const projectTestCases = sortByIdNumber(
    globalState.testCases.filter((t) => projectTestCaseIds.includes(t.id) && !t.isDeleted)
  );
  const projectInformation = sortByIdNumber(
    globalState.information.filter((i) => projectInformationIds.includes(i.id) && !i.isDeleted)
  );
  const projectRisks = sortByIdNumber(
    (globalState.risks || []).filter((r) => project.riskIds?.includes(r.id) && !r.isDeleted)
  );

  // Pre-fetch links and build artifact ID list if needed for Matrices or Links sheet
  const projectLinks =
    includeLinks || includeTraceability || includeVerificationMatrix
      ? await diskLinkService.getLinksForProject(project.id)
      : [];

  const allArtifactIds = includeTraceability
    ? [
        ...projectRequirements.map((r) => ({ id: r.id, type: 'REQ' })),
        ...projectUseCases.map((u) => ({ id: u.id, type: 'UC' })),
        ...projectTestCases.map((t) => ({ id: t.id, type: 'TC' })),
        ...projectInformation.map((i) => ({ id: i.id, type: 'INFO' })),
        ...projectRisks.map((r) => ({ id: r.id, type: 'RISK' })),
      ]
    : [];

  // 1. Revision History
  if (includeRevisionHistory) {
    const sortedBaselines = [...baselines].sort((a, b) => b.timestamp - a.timestamp);
    const lastBaseline = sortedBaselines.length > 0 ? sortedBaselines[0] : null;

    const historyData: {
      'Artifact Type': string;
      ID: string;
      Title: string;
      Date: string;
      Author: string;
      Message: string;
      Hash: string;
    }[] = [];

    // Helper to fetch and format history
    const fetchHistory = async (
      type: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks',
      id: string,
      title: string
    ) => {
      try {
        const history = await realGitService.getHistory(`${type}/${id}.md`);
        const filteredHistory = lastBaseline
          ? history.filter((commit) => commit.timestamp > lastBaseline.timestamp)
          : history;

        filteredHistory.forEach((commit) => {
          historyData.push({
            'Artifact Type': type.charAt(0).toUpperCase() + type.slice(1, -1), // Remove 's' and capitalize
            ID: id,
            Title: title,
            Date: formatDate(commit.timestamp),
            Author: commit.author,
            Message: commit.message,
            Hash: commit.hash.substring(0, 7),
          });
        });
      } catch (error) {
        console.error(`Failed to fetch history for ${id}`, error);
      }
    };

    // Fetch history for all artifacts
    for (const req of projectRequirements) await fetchHistory('requirements', req.id, req.title);
    for (const uc of projectUseCases) await fetchHistory('usecases', uc.id, uc.title);
    for (const tc of projectTestCases) await fetchHistory('testcases', tc.id, tc.title);
    for (const info of projectInformation) await fetchHistory('information', info.id, info.title);
    for (const risk of projectRisks) await fetchHistory('risks', risk.id, risk.title);

    // Sort history by date descending
    historyData.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    if (historyData.length > 0) {
      const wsHistory = XLSX.utils.json_to_sheet(historyData);
      // Set column widths
      wsHistory['!cols'] = [
        { wch: 15 }, // Type
        { wch: 15 }, // ID
        { wch: 30 }, // Title
        { wch: 20 }, // Date
        { wch: 15 }, // Author
        { wch: 50 }, // Message
        { wch: 10 }, // Hash
      ];
      XLSX.utils.book_append_sheet(wb, wsHistory, 'Revision History');
    }
  }

  // 2. Requirements Sheet
  if (includeRequirements && projectRequirements.length > 0) {
    const reqData = projectRequirements.map((req) => ({
      ID: req.id,
      Title: req.title,
      Revision: req.revision || '01',
      Status: req.status || 'draft',
      Priority: req.priority || 'medium',
      Author: req.author || '',
      Description: sanitize(req.description),
      'Requirement Text': sanitize(req.text),
      Rationale: sanitize(req.rationale),
      Comments: sanitize(req.comments),
      'Verification Method': req.verificationMethod || '',
      Created: formatDate(req.dateCreated),
      'Last Modified': formatDate(req.lastModified),
      Approved: req.approvalDate ? formatDate(req.approvalDate) : '',
      ...addCustomAttributeColumns(req, customAttributeDefinitions, 'requirement'),
    }));

    const wsReq = XLSX.utils.json_to_sheet(reqData);
    wsReq['!cols'] = [
      { wch: 15 }, // ID
      { wch: 30 }, // Title
      { wch: 8 }, // Rev
      { wch: 10 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Author
      { wch: 40 }, // Description
      { wch: 40 }, // Text
      { wch: 30 }, // Rationale
      { wch: 30 }, // Comments
      { wch: 15 }, // Verification
      { wch: 15 }, // Created
      { wch: 15 }, // Modified
      { wch: 15 }, // Approved
    ];
    XLSX.utils.book_append_sheet(wb, wsReq, 'Requirements');
  }

  // 3. Use Cases Sheet
  if (includeUseCases && projectUseCases.length > 0) {
    const ucData = projectUseCases.map((uc) => ({
      ID: uc.id,
      Title: uc.title,
      Revision: uc.revision || '01',
      Status: uc.status || 'draft',
      Priority: uc.priority || 'medium',
      Actor: uc.actor || '',
      Description: sanitize(uc.description),
      Preconditions: sanitize(uc.preconditions || uc.precondition),
      'Main Flow': sanitize(uc.mainFlow),
      'Alternative Flows': sanitize(uc.alternativeFlows),
      Postconditions: sanitize(uc.postconditions || uc.postcondition),
      'Last Modified': formatDate(uc.lastModified),
      ...addCustomAttributeColumns(uc, customAttributeDefinitions, 'useCase'),
    }));

    const wsUc = XLSX.utils.json_to_sheet(ucData);
    wsUc['!cols'] = [
      { wch: 15 }, // ID
      { wch: 30 }, // Title
      { wch: 8 }, // Rev
      { wch: 10 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Actor
      { wch: 40 }, // Description
      { wch: 30 }, // Pre
      { wch: 50 }, // Main Flow
      { wch: 40 }, // Alt Flows
      { wch: 30 }, // Post
      { wch: 15 }, // Modified
    ];
    XLSX.utils.book_append_sheet(wb, wsUc, 'Use Cases');
  }

  // 4. Test Cases Sheet
  if (includeTestCases && projectTestCases.length > 0) {
    const tcData = projectTestCases.map((tc) => ({
      ID: tc.id,
      Title: tc.title,
      Revision: tc.revision || '01',
      Status: tc.status || 'draft',
      Priority: tc.priority || 'medium',
      Author: tc.author || '',
      Description: sanitize(tc.description),
      'Tests Requirements': tc.requirementIds ? tc.requirementIds.join(', ') : '',
      Created: formatDate(tc.dateCreated),
      'Last Modified': formatDate(tc.lastModified),
      'Last Run': tc.lastRun ? formatDate(tc.lastRun) : '',
      ...addCustomAttributeColumns(tc, customAttributeDefinitions, 'testCase'),
    }));

    const wsTc = XLSX.utils.json_to_sheet(tcData);
    wsTc['!cols'] = [
      { wch: 15 }, // ID
      { wch: 30 }, // Title
      { wch: 8 }, // Rev
      { wch: 10 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Author
      { wch: 40 }, // Description
      { wch: 30 }, // Tests Reqs
      { wch: 15 }, // Created
      { wch: 15 }, // Modified
      { wch: 15 }, // Last Run
    ];
    XLSX.utils.book_append_sheet(wb, wsTc, 'Test Cases');
  }

  // 5. Information Sheet
  if (includeInformation && projectInformation.length > 0) {
    const infoData = projectInformation.map((info) => ({
      ID: info.id,
      Title: info.title,
      Revision: info.revision || '01',
      Type: info.type || 'note',
      Content: sanitize(info.content || info.text),
      Created: formatDate(info.dateCreated),
      'Last Modified': formatDate(info.lastModified),
      ...addCustomAttributeColumns(info, customAttributeDefinitions, 'information'),
    }));

    const wsInfo = XLSX.utils.json_to_sheet(infoData);
    wsInfo['!cols'] = [
      { wch: 15 }, // ID
      { wch: 30 }, // Title
      { wch: 8 }, // Rev
      { wch: 15 }, // Type
      { wch: 60 }, // Content
      { wch: 15 }, // Created
      { wch: 15 }, // Modified
    ];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Information');
  }

  // 6. Risks Sheet
  if (includeRisks && projectRisks.length > 0) {
    const capitalizeWord = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
    const riskData = projectRisks.map((risk) => ({
      ID: risk.id,
      Title: risk.title,
      Revision: risk.revision || '01',
      Category: capitalizeWord(risk.category || 'other'),
      Probability: capitalizeWord(risk.probability || 'medium'),
      Impact: capitalizeWord(risk.impact || 'medium'),
      Status: capitalizeWord(risk.status || 'open'),
      Owner: risk.owner || '',
      Description: sanitize(risk.description),
      Mitigation: sanitize(risk.mitigation),
      Contingency: sanitize(risk.contingency),
      Created: formatDate(risk.dateCreated),
      'Last Modified': formatDate(risk.lastModified),
      ...addCustomAttributeColumns(risk, customAttributeDefinitions, 'risk'),
    }));

    const wsRisks = XLSX.utils.json_to_sheet(riskData);
    wsRisks['!cols'] = [
      { wch: 12 }, // ID
      { wch: 30 }, // Title
      { wch: 8 }, // Rev
      { wch: 12 }, // Category
      { wch: 10 }, // Probability
      { wch: 10 }, // Impact
      { wch: 12 }, // Status
      { wch: 15 }, // Owner
      { wch: 40 }, // Description
      { wch: 40 }, // Mitigation
      { wch: 40 }, // Contingency
      { wch: 15 }, // Created
      { wch: 15 }, // Modified
    ];
    XLSX.utils.book_append_sheet(wb, wsRisks, 'Risks');
  }

  // 7. Links Sheet - fetch from diskLinkService
  if (includeLinks && projectLinks.length > 0) {
    const sortedLinks = sortByIdNumber(projectLinks) as Link[];
    const linkData = sortedLinks.map((link) => ({
      'Link ID': link.id,
      Source: link.sourceId,
      Type: LINK_TYPE_LABELS[link.type] || link.type,
      Target: link.targetId,
      Scope: link.projectIds.length === 0 ? 'Global' : 'Project',
      Created: formatDate(link.dateCreated),
      'Last Modified': formatDate(link.lastModified),
    }));

    const wsLinks = XLSX.utils.json_to_sheet(linkData);
    wsLinks['!cols'] = [
      { wch: 12 }, // Link ID
      { wch: 15 }, // Source
      { wch: 20 }, // Type
      { wch: 15 }, // Target
      { wch: 10 }, // Scope
      { wch: 15 }, // Created
      { wch: 15 }, // Modified
    ];
    XLSX.utils.book_append_sheet(wb, wsLinks, 'Links');
  }

  // 8. Traceability Matrix (all artifact types including Risks, using Link entities)
  if (includeTraceability && allArtifactIds.length > 0) {
    const matrixData: Record<string, string>[] = [];

    // Build a lookup map for links: sourceId -> { targetId: linkType }
    const linkMap = new Map<string, Map<string, string>>();
    for (const link of projectLinks) {
      if (!linkMap.has(link.sourceId)) {
        linkMap.set(link.sourceId, new Map());
      }
      linkMap.get(link.sourceId)!.set(link.targetId, link.type);
    }

    // Link type abbreviations for readability
    const linkAbbreviations: Record<string, string> = {
      parent: 'PAR',
      child: 'CHD',
      derived_from: 'DER',
      depends_on: 'DEP',
      conflicts_with: 'CNF',
      duplicates: 'DUP',
      refines: 'REF',
      satisfies: 'SAT',
      verifies: 'VER',
      constrains: 'CON',
      requires: 'REQ',
      related_to: 'REL',
    };

    allArtifactIds.forEach((rowArtifact) => {
      const row: Record<string, string> = { 'From / To': rowArtifact.id };

      allArtifactIds.forEach((colArtifact) => {
        if (rowArtifact.id === colArtifact.id) {
          row[colArtifact.id] = '-';
          return;
        }

        let cellValue = '';

        // Check for link from row to col using the new Link entities
        const sourceLinks = linkMap.get(rowArtifact.id);
        if (sourceLinks) {
          const linkType = sourceLinks.get(colArtifact.id);
          if (linkType) {
            cellValue = linkAbbreviations[linkType] || linkType;
          }
        }

        row[colArtifact.id] = cellValue;
      });

      matrixData.push(row);
    });

    const wsMatrix = XLSX.utils.json_to_sheet(matrixData);

    // Set column widths
    const cols = [{ wch: 15 }]; // First column width
    allArtifactIds.forEach(() => cols.push({ wch: 6 })); // Other columns width
    wsMatrix['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Traceability Matrix');

    // Add legend sheet
    const legendData = [
      {
        Abbreviation: 'PAR',
        'Link Type': 'Parent',
        Description: 'Hierarchical decomposition - row is parent of column',
      },
      {
        Abbreviation: 'CHD',
        'Link Type': 'Child',
        Description: 'Hierarchical decomposition - row is child of column',
      },
      {
        Abbreviation: 'DER',
        'Link Type': 'Derived From',
        Description: 'Logical derivation, not strict hierarchy',
      },
      { Abbreviation: 'DEP', 'Link Type': 'Depends On', Description: 'Row depends on column' },
      { Abbreviation: 'CNF', 'Link Type': 'Conflicts With', Description: 'Mutual exclusivity' },
      { Abbreviation: 'DUP', 'Link Type': 'Duplicates', Description: 'Redundancy or overlap' },
      {
        Abbreviation: 'REF',
        'Link Type': 'Refines',
        Description: 'Adds detail without changing intent',
      },
      {
        Abbreviation: 'SAT',
        'Link Type': 'Satisfies',
        Description: 'Links to design or implementation',
      },
      {
        Abbreviation: 'VER',
        'Link Type': 'Verifies',
        Description: 'Links to test cases or validation',
      },
      {
        Abbreviation: 'CON',
        'Link Type': 'Constrains',
        Description: 'Imposes restrictions on column',
      },
      {
        Abbreviation: 'REQ',
        'Link Type': 'Requires',
        Description: 'Row is a precondition for column',
      },
      {
        Abbreviation: 'REL',
        'Link Type': 'Related To',
        Description: 'Generic association for context',
      },
    ];
    const wsLegend = XLSX.utils.json_to_sheet(legendData);
    wsLegend['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsLegend, 'Matrix Legend');
  }

  // 9. Verification Matrix (Worksheet for test engineers)
  if (includeVerificationMatrix && projectRequirements.length > 0 && projectTestCases.length > 0) {
    const verificationData: Record<string, string>[] = [];

    // Add instructions rows
    verificationData.push({
      'Requirement ID': 'INSTRUCTIONS:',
      'Requirement Title': 'Test engineers: Record verification results in columns E-H.',
    });
    verificationData.push({
      'Requirement ID': 'STATUS OPTIONS:',
      'Requirement Title': 'Pass, Fail, Blocked, In Progress, N/A',
    });
    verificationData.push({}); // Empty row for spacing

    // Find all 'verifies' links
    const verificationLinks = projectLinks.filter((l: Link) => l.type === 'verifies');

    // Create a map: Requirement ID (target) -> Test Case IDs (sources)
    const reqToTestMap = new Map<string, string[]>();
    verificationLinks.forEach((link: Link) => {
      // Logic Fix: Requirement is usually the target of a verification link from a Test Case
      const reqId = link.targetId;
      const tcId = link.sourceId;

      if (!reqToTestMap.has(reqId)) {
        reqToTestMap.set(reqId, []);
      }
      reqToTestMap.get(reqId)!.push(tcId);
    });

    projectRequirements.forEach((req) => {
      const linkedTestIds = reqToTestMap.get(req.id) || [];

      if (linkedTestIds.length > 0) {
        linkedTestIds.forEach((tcId) => {
          const tc = projectTestCases.find((t) => t.id === tcId);
          verificationData.push({
            'Requirement ID': req.id,
            'Requirement Title': req.title,
            'Test Case ID': tcId,
            'Test Case Title': tc?.title || 'Unknown',
            'Verification Status': '', // To be filled by engineer
            Tester: '',
            Date: '',
            'Evidence / Notes': '',
          });
        });
      } else {
        // Requirement without a test case (unverified)
        verificationData.push({
          'Requirement ID': req.id,
          'Requirement Title': req.title,
          'Test Case ID': 'NOT LINKED',
          'Test Case Title': 'No verification test case found',
          'Verification Status': 'N/A',
          Tester: 'N/A',
          Date: 'N/A',
          'Evidence / Notes': 'Warning: Requirement has no linked verification test case',
        });
      }
    });

    const wsVerification = XLSX.utils.json_to_sheet(verificationData);

    // Set column widths
    wsVerification['!cols'] = [
      { wch: 15 }, // Req ID
      { wch: 30 }, // Req Title
      { wch: 15 }, // TC ID
      { wch: 30 }, // TC Title
      { wch: 18 }, // Status
      { wch: 15 }, // Tester
      { wch: 12 }, // Date
      { wch: 50 }, // Evidence
    ];

    // Add Data Validation (Dropdowns) for the 'Verification Status' column
    // The Status column is the 5th column (Index 4, column 'E')
    // We apply this to all data rows (skipping header)
    const range = XLSX.utils.decode_range(wsVerification['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const address = XLSX.utils.encode_cell({ r: R, c: 4 });
      if (!wsVerification[address]) continue; // Skip if cell is mysteriously missing

      // Note: Full data validation support in xlsx (SheetJS) pro version usually,
      // but for basic cell dropdowns in standard XLSX format, we can try to inject it.
      // However, the standard SheetJS community version doesn't support writing Data Validation (dropdowns).
      // We will instead follow the standard and just provide a clear header/instruction.
    }

    XLSX.utils.book_append_sheet(wb, wsVerification, 'Verification Matrix');
  }

  // Write file using the file handle obtained at the start, or fallback to download
  if (fileHandle) {
    try {
      const writable = await fileHandle.createWritable();
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      await writable.write(new Blob([wbout], { type: 'application/octet-stream' }));
      await writable.close();
    } catch (err) {
      console.error('Error writing to file:', err);
      XLSX.writeFile(wb, defaultFilename);
    }
  } else {
    // Fallback download
    XLSX.writeFile(wb, defaultFilename);
  }
}
