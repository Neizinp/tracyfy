import type {
  Project,
  Requirement,
  UseCase,
  TestCase,
  Information,
  Link,
  Risk,
  ArtifactDocument,
} from '../types';
import { diskLinkService } from '../services/diskLinkService';

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

export interface ExportData {
  project: {
    id: string;
    name: string;
    description: string;
    currentBaseline: string | null;
    lastModified: number;
  };
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks: Risk[];
  documents: ArtifactDocument[];
  links: Link[];
  exportedAt: string;
}

export async function exportProjectToJSON(
  project: Project,
  globalState: {
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    risks?: Risk[];
    documents?: ArtifactDocument[];
  },
  projectRequirementIds: string[],
  projectUseCaseIds: string[],
  projectTestCaseIds: string[],
  projectInformationIds: string[],
  projectRiskIds: string[] = [],
  projectDocumentIds: string[] = []
): Promise<void> {
  // Filter artifacts and sort by ID number for consistent ordering
  const requirements = sortByIdNumber(
    globalState.requirements.filter((r) => projectRequirementIds.includes(r.id) && !r.isDeleted)
  );
  const useCases = sortByIdNumber(
    globalState.useCases.filter((u) => projectUseCaseIds.includes(u.id) && !u.isDeleted)
  );
  const testCases = sortByIdNumber(
    globalState.testCases.filter((t) => projectTestCaseIds.includes(t.id) && !t.isDeleted)
  );
  const information = sortByIdNumber(
    globalState.information.filter((i) => projectInformationIds.includes(i.id) && !i.isDeleted)
  );

  // Fetch links visible to this project (global + project-specific)
  const links = sortByIdNumber(await diskLinkService.getLinksForProject(project.id));

  // Filter risks for this project
  const risks = sortByIdNumber(
    (globalState.risks || []).filter((r) => projectRiskIds.includes(r.id) && !r.isDeleted)
  );

  // Filter documents for this project
  const documents = sortByIdNumber(
    (globalState.documents || []).filter((d) => projectDocumentIds.includes(d.id) && !d.isDeleted)
  );

  const dataToExport: ExportData = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      currentBaseline: project.currentBaseline || null,
      lastModified: project.lastModified,
    },
    requirements,
    useCases,
    testCases,
    information,
    risks,
    documents,
    links,
    exportedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(dataToExport, null, 2);

  // Filename generation
  let filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}`;
  if (project.currentBaseline) {
    filename += `_${project.currentBaseline.replace(/[^a-z0-9]/gi, '_')}`;
  }
  filename += '.json';

  // Try to use File System Access API if available (for "Save As")
  try {
    if ('showSaveFilePicker' in window) {
      const handle = await (
        window as any as Window & {
          showSaveFilePicker: (options: any) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'JSON File',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([jsonString], { type: 'application/json' }));
      await writable.close();
      return;
    }
  } catch (err) {
    // Fallback to download if cancelled or not supported
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Error with save file picker:', err);
    } else {
      return; // User cancelled
    }
  }

  // Fallback download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
