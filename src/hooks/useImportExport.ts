import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Project,
  ArtifactDocument,
} from '../types';
import { exportProjectToJSON } from '../utils/jsonExportUtils';
import * as XLSX from 'xlsx';

interface UseImportExportProps {
  currentProjectId: string;
  projects: Project[];
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  documents: ArtifactDocument[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
  setUseCases: (ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => void;
  setTestCases: (tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
  setInformation: (info: Information[] | ((prev: Information[]) => Information[])) => void;
  setDocuments: (
    docs: ArtifactDocument[] | ((prev: ArtifactDocument[]) => ArtifactDocument[])
  ) => void;
}

export function useImportExport({
  currentProjectId,
  projects,
  requirements,
  useCases,
  testCases,
  information,
  documents,
  setRequirements,
  setUseCases,
  setTestCases,
  setInformation,
  setDocuments,
}: UseImportExportProps) {
  const handleExport = async () => {
    const project = projects.find((p) => p.id === currentProjectId);
    if (!project) {
      alert('No project selected');
      return;
    }

    try {
      await exportProjectToJSON(
        project,
        {
          requirements,
          useCases,
          testCases,
          information,
          documents,
        },
        project.requirementIds,
        project.useCaseIds,
        project.testCaseIds,
        project.informationIds,
        project.riskIds || [],
        project.documentIds || []
      );
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project: ' + error);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            // Links are now stored in each artifact's linkedArtifacts field
            setRequirements(json.requirements || []);
            setUseCases(json.useCases || []);
            setTestCases(json.testCases || []);
            setInformation(json.information || []);
            setDocuments(json.documents || []);
          } catch {
            alert('Failed to parse JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            interface RequirementExcelRow {
              ID: string;
              Title: string;
              Status?: string;
              Priority?: string;
              Description?: string;
              'Requirement Text'?: string;
              Rationale?: string;
              Parents?: string;
            }

            interface UseCaseExcelRow {
              ID: string;
              Title: string;
              Actor?: string;
              Description?: string;
              Preconditions?: string;
              'Main Flow'?: string;
              'Alternative Flows'?: string;
              Postconditions?: string;
              Priority?: string;
              Status?: string;
            }

            // Parse Requirements
            const reqSheet = workbook.Sheets['Requirements'];
            if (reqSheet) {
              const reqData = XLSX.utils.sheet_to_json<RequirementExcelRow>(reqSheet);
              const parsedReqs: Requirement[] = reqData.map((row) => ({
                id: row['ID'],
                title: row['Title'],
                status: row['Status'] || 'draft',
                priority: row['Priority'] || 'medium',
                description: row['Description'] || '',
                text: row['Requirement Text'] || '',
                rationale: row['Rationale'] || '',
                parentIds: row['Parents']
                  ? row['Parents']
                      .split(',')
                      .map((id: string) => id.trim())
                      .filter((id: string) => id)
                  : [],
                dateCreated: Date.now(),
                lastModified: Date.now(),
                revision: '01',
                linkedArtifacts: [], // Links are now per-artifact
              }));
              setRequirements(parsedReqs);
            }

            // Parse Use Cases
            const ucSheet = workbook.Sheets['Use Cases'];
            if (ucSheet) {
              const ucData = XLSX.utils.sheet_to_json<UseCaseExcelRow>(ucSheet);
              const parsedUCs: UseCase[] = ucData.map((row) => ({
                id: row['ID'],
                title: row['Title'],
                actor: row['Actor'] || '',
                description: row['Description'] || '',
                preconditions: row['Preconditions'] || '',
                mainFlow: row['Main Flow'] || '',
                alternativeFlows: row['Alternative Flows'] || '',
                postconditions: row['Postconditions'] || '',
                priority: row['Priority'] || 'medium',
                status: row['Status'] || 'draft',
                lastModified: Date.now(),
                revision: '01',
                linkedArtifacts: [], // Links are now per-artifact
              }));
              setUseCases(parsedUCs);
            }

            // Note: Links sheet is deprecated - links are now stored in each artifact's linkedArtifacts

            alert('Excel file imported successfully');
          } catch (error) {
            console.error('Failed to parse Excel file:', error);
            alert('Failed to parse Excel file: ' + error);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  return {
    handleExport,
    handleImport,
    handleImportExcel,
  };
}
