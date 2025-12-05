import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState as useGlobalStateHook } from '../../hooks/useGlobalState';
import { useProject } from './ProjectProvider';
import { useUI } from './UIProvider';
import type { Requirement, UseCase, TestCase, Information, Link } from '../../types';

interface GlobalStateContextValue {
  // Global artifacts
  globalRequirements: Requirement[];
  globalUseCases: UseCase[];
  globalTestCases: TestCase[];
  globalInformation: Information[];

  // Links
  links: Link[];
  setLinks: (links: Link[] | ((prev: Link[]) => Link[])) => void;

  // Local project artifacts
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
  useCases: UseCase[];
  setUseCases: (ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => void;
  testCases: TestCase[];
  setTestCases: (tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
  information: Information[];
  setInformation: (info: Information[] | ((prev: Information[]) => Information[])) => void;

  // Used numbers
  usedReqNumbers: Set<number>;
  setUsedReqNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  usedUcNumbers: Set<number>;
  setUsedUcNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  usedTestNumbers: Set<number>;
  setUsedTestNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  usedInfoNumbers: Set<number>;
  setUsedInfoNumbers: (nums: Set<number> | ((prev: Set<number>) => Set<number>)) => void;

  // Internal ref
  isResetting: React.MutableRefObject<boolean>;
}

const GlobalStateContext = createContext<GlobalStateContextValue | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { projects, currentProjectId, initialGlobalState, setProjects, setHasInitializedProjects } =
    useProject();

  const { getDefaultColumnVisibility, setColumnVisibility } = useUI();

  const globalState = useGlobalStateHook({
    projects,
    currentProjectId,
    initialGlobalState,
    setProjects,
    setHasInitializedProjects,
    getDefaultColumnVisibility,
    setColumnVisibility,
  });

  return <GlobalStateContext.Provider value={globalState}>{children}</GlobalStateContext.Provider>;
};

export const useGlobalState = (): GlobalStateContextValue => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
