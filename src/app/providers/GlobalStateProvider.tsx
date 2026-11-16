/**
 * Global State Provider
 *
 * Read-only view over FileSystemProvider's data (the single source of truth):
 * - global*: every artifact, as loaded from / saved to disk
 * - requirements, useCases, ...: the same, filtered to the current project
 *
 * Nothing here is stored separately, so the UI can never show data that
 * differs from what FileSystemProvider has written to disk.
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useFileSystem } from './FileSystemProvider';
import { useProject } from './ProjectProvider';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  ArtifactDocument,
  Link,
} from '../../types';

export interface GlobalStateContextValue {
  // Global artifacts (all artifacts regardless of project)
  globalRequirements: Requirement[];
  globalUseCases: UseCase[];
  globalTestCases: TestCase[];
  globalInformation: Information[];
  globalRisks: Risk[];
  globalDocuments: ArtifactDocument[];
  globalLinks: Link[];

  // Current project's artifacts (all artifacts when no project is selected)
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks: Risk[];
  documents: ArtifactDocument[];
  links: Link[];
}

const GlobalStateContext = createContext<GlobalStateContextValue | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const fs = useFileSystem();
  const { currentProject } = useProject();

  const value = useMemo<GlobalStateContextValue>(() => {
    const globalState = {
      globalRequirements: fs.requirements,
      globalUseCases: fs.useCases,
      globalTestCases: fs.testCases,
      globalInformation: fs.information,
      globalRisks: fs.risks,
      globalDocuments: fs.documents,
      globalLinks: fs.links,
    };
    if (!currentProject) {
      return {
        ...globalState,
        requirements: fs.requirements,
        useCases: fs.useCases,
        testCases: fs.testCases,
        information: fs.information,
        risks: fs.risks,
        documents: fs.documents,
        links: fs.links,
      };
    }
    const inProject = (ids: string[] | undefined) => {
      const set = new Set(ids ?? []);
      return <T extends { id: string }>(a: T) => set.has(a.id);
    };
    return {
      ...globalState,
      requirements: fs.requirements.filter(inProject(currentProject.requirementIds)),
      useCases: fs.useCases.filter(inProject(currentProject.useCaseIds)),
      testCases: fs.testCases.filter(inProject(currentProject.testCaseIds)),
      information: fs.information.filter(inProject(currentProject.informationIds)),
      risks: fs.risks.filter(inProject(currentProject.riskIds)),
      documents: fs.documents.filter(
        (d) => d.projectId === currentProject.id || !!currentProject.documentIds?.includes(d.id)
      ),
      links: fs.links, // Links are global; views filter by projectIds where needed
    };
  }, [
    currentProject,
    fs.requirements,
    fs.useCases,
    fs.testCases,
    fs.information,
    fs.risks,
    fs.documents,
    fs.links,
  ]);

  return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
};

export const useGlobalState = (): GlobalStateContextValue => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
