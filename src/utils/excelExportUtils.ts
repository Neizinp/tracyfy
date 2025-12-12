import * as XLSX from 'xlsx';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Project,
  ProjectBaseline,
  ArtifactLink,
} from '../types';
import { formatDate } from './dateUtils';
import { realGitService } from '../services/realGitService';

// Helper to sanitize text for Excel (remove newlines if needed, or keep them)
// Excel handles newlines in cells if wrapText is on.
const sanitize = (text: string | undefined) => text || '';

export async function exportProjectToExcel(
  project: Project,
  globalState: {
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
  },
  projectRequirementIds: string[],
  projectUseCaseIds: string[],
  projectTestCaseIds: string[],
  projectInformationIds: string[],
  baselines: ProjectBaseline[]
): Promise<void> {
  const wb = XLSX.utils.book_new();

  // Filter artifacts
  const projectRequirements = globalState.requirements.filter(
    (r) => projectRequirementIds.includes(r.id) && !r.isDeleted
  );
  const projectUseCases = globalState.useCases.filter(
    (u) => projectUseCaseIds.includes(u.id) && !u.isDeleted
  );
  const projectTestCases = globalState.testCases.filter(
    (t) => projectTestCaseIds.includes(t.id) && !t.isDeleted
  );
  const projectInformation = globalState.information.filter(
    (i) => projectInformationIds.includes(i.id) && !i.isDeleted
  );

  // 1. Revision History
  const sortedBaselines = [...baselines].sort((a, b) => b.timestamp - a.timestamp);
  const lastBaseline = sortedBaselines.length > 0 ? sortedBaselines[0] : null;

  const historyData: any[] = [];

  // Helper to fetch and format history
  const fetchHistory = async (
    type: 'requirements' | 'usecases' | 'testcases' | 'information',
    id: string,
    title: string
  ) => {
    try {
      const history = await realGitService.getHistory(`${type}/${id}.json`);
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

  // 2. Requirements Sheet
  if (projectRequirements.length > 0) {
    const reqData = projectRequirements.map((req) => ({
      ID: req.id,
      Title: req.title,
      Revision: req.revision || '01',
      Status: req.status,
      Priority: req.priority,
      Author: req.author || '',
      Description: sanitize(req.description),
      'Requirement Text': sanitize(req.text),
      Rationale: sanitize(req.rationale),
      Comments: sanitize(req.comments),
      'Verification Method': req.verificationMethod || '',
      Created: formatDate(req.dateCreated),
      'Last Modified': formatDate(req.lastModified),
      Approved: req.approvalDate ? formatDate(req.approvalDate) : '',
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
  if (projectUseCases.length > 0) {
    const ucData = projectUseCases.map((uc) => ({
      ID: uc.id,
      Title: uc.title,
      Revision: uc.revision || '01',
      Status: uc.status,
      Priority: uc.priority,
      Actor: uc.actor || '',
      Description: sanitize(uc.description),
      Preconditions: sanitize(uc.preconditions),
      'Main Flow': sanitize(uc.mainFlow),
      'Alternative Flows': sanitize(uc.alternativeFlows),
      Postconditions: sanitize(uc.postconditions),
      'Last Modified': formatDate(uc.lastModified),
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
  if (projectTestCases.length > 0) {
    const tcData = projectTestCases.map((tc) => ({
      ID: tc.id,
      Title: tc.title,
      Revision: tc.revision || '01',
      Status: tc.status,
      Priority: tc.priority,
      Author: tc.author || '',
      Description: sanitize(tc.description),
      'Tests Requirements': tc.requirementIds ? tc.requirementIds.join(', ') : '',
      Created: formatDate(tc.dateCreated),
      'Last Modified': formatDate(tc.lastModified),
      'Last Run': tc.lastRun ? formatDate(tc.lastRun) : '',
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
  if (projectInformation.length > 0) {
    const infoData = projectInformation.map((info) => ({
      ID: info.id,
      Title: info.title,
      Revision: info.revision || '01',
      Type: info.type,
      Content: sanitize(info.content),
      Created: formatDate(info.dateCreated),
      'Last Modified': formatDate(info.lastModified),
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

  // 6. Traceability Matrix (all artifact types)
  const allArtifacts = [
    ...projectRequirements.map((r) => ({
      id: r.id,
      type: 'REQ',
      linkedArtifacts: r.linkedArtifacts || [],
    })),
    ...projectUseCases.map((u) => ({
      id: u.id,
      type: 'UC',
      linkedArtifacts: u.linkedArtifacts || [],
    })),
    ...projectTestCases.map((t) => ({
      id: t.id,
      type: 'TC',
      linkedArtifacts: [
        ...(t.linkedArtifacts || []),
        // Include legacy requirementIds as verifies links
        ...(t.requirementIds || []).map((reqId) => ({
          targetId: reqId,
          type: 'verifies' as const,
        })),
      ],
    })),
    ...projectInformation.map((i) => ({
      id: i.id,
      type: 'INFO',
      linkedArtifacts: i.linkedArtifacts || [],
    })),
  ];

  if (allArtifacts.length > 0) {
    const matrixData: any[] = [];

    // Build ID set for validation
    const artifactIds = new Set(allArtifacts.map((a) => a.id));

    // Helper to find link between two artifacts
    const getLink = (fromId: string, toId: string): ArtifactLink | undefined => {
      const fromArtifact = allArtifacts.find((a) => a.id === fromId);
      if (fromArtifact) {
        const link = fromArtifact.linkedArtifacts.find((l) => l.targetId === toId);
        if (link) return link;
      }
      return undefined;
    };

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

    allArtifacts.forEach((rowArtifact) => {
      const row: any = { 'From / To': rowArtifact.id };

      allArtifacts.forEach((colArtifact) => {
        if (rowArtifact.id === colArtifact.id) {
          row[colArtifact.id] = '-';
          return;
        }

        let cellValue = '';

        // Check for link from row to col
        const link = getLink(rowArtifact.id, colArtifact.id);
        if (link && artifactIds.has(link.targetId)) {
          cellValue = linkAbbreviations[link.type] || link.type;
        }

        row[colArtifact.id] = cellValue;
      });

      matrixData.push(row);
    });

    const wsMatrix = XLSX.utils.json_to_sheet(matrixData);

    // Set column widths
    const cols = [{ wch: 15 }]; // First column width
    allArtifacts.forEach(() => cols.push({ wch: 6 })); // Other columns width
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

  // Write file
  let defaultFilename = `${project.name.replace(/[^a-z0-9]/gi, '_')}`;
  if (project.currentBaseline) {
    defaultFilename += `_${project.currentBaseline.replace(/[^a-z0-9]/gi, '_')}`;
  }
  defaultFilename += '-export.xlsx';

  // Try to use File System Access API if available (for "Save As")
  try {
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
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
      const writable = await handle.createWritable();
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      await writable.write(new Blob([wbout], { type: 'application/octet-stream' }));
      await writable.close();
      return;
    }
  } catch (err) {
    // Fallback to download if cancelled or not supported
    if ((err as any).name !== 'AbortError') {
      console.error('Error with save file picker:', err);
    } else {
      return; // User cancelled
    }
  }

  // Fallback download
  XLSX.writeFile(wb, defaultFilename);
}
