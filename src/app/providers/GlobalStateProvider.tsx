/**
 * Global State Provider
 *
 * Read-only view over FileSystemProvider's data (the single source of truth):
 * every artifact in the project folder, as loaded from / saved to disk.
 *
 * Nothing here is stored separately, so the UI can never show data that
 * differs from what FileSystemProvider has written to disk.
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useFileSystem } from './FileSystemProvider';
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

  // Everything in the project folder belongs to the project
  const value = useMemo<GlobalStateContextValue>(
    () => ({
      requirements: fs.requirements,
      useCases: fs.useCases,
      testCases: fs.testCases,
      information: fs.information,
      risks: fs.risks,
      documents: fs.documents,
      links: fs.links,
    }),
    [fs.requirements, fs.useCases, fs.testCases, fs.information, fs.risks, fs.documents, fs.links]
  );

  return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
};

export const useGlobalState = (): GlobalStateContextValue => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
