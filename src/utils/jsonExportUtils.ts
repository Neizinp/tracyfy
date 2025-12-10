import type { Project, Requirement, UseCase, TestCase, Information } from '../types';

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
  exportedAt: string;
}

export async function exportProjectToJSON(
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
  projectInformationIds: string[]
): Promise<void> {
  // Filter artifacts
  const requirements = globalState.requirements.filter(
    (r) => projectRequirementIds.includes(r.id) && !r.isDeleted
  );
  const useCases = globalState.useCases.filter(
    (u) => projectUseCaseIds.includes(u.id) && !u.isDeleted
  );
  const testCases = globalState.testCases.filter(
    (t) => projectTestCaseIds.includes(t.id) && !t.isDeleted
  );
  const information = globalState.information.filter(
    (i) => projectInformationIds.includes(i.id) && !i.isDeleted
  );

  // Note: Links are now stored in each artifact's linkedArtifacts field
  // They are automatically exported as part of the artifact data

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
      const handle = await (window as any).showSaveFilePicker({
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
    if ((err as any).name !== 'AbortError') {
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
