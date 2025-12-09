import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useFileSystem } from './FileSystemProvider';
import { useProject } from './ProjectProvider';
import type { Requirement, UseCase, TestCase, Information, Link } from '../../types';

interface GlobalStateContextValue {
  // Global artifacts (all artifacts regardless of project)
  globalRequirements: Requirement[];
  globalUseCases: UseCase[];
  globalTestCases: TestCase[];
  globalInformation: Information[];

  // Links
  links: Link[];
  setLinks: (links: Link[] | ((prev: Link[]) => Link[])) => void;

  // Local project artifacts (filtered by current project)
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
  useCases: UseCase[];
  setUseCases: (ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => void;
  testCases: TestCase[];
  setTestCases: (tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
  information: Information[];
  setInformation: (info: Information[] | ((prev: Information[]) => Information[])) => void;

  // Internal ref
  isResetting: React.MutableRefObject<boolean>;
}

const GlobalStateContext = createContext<GlobalStateContextValue | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    requirements: fsRequirements,
    useCases: fsUseCases,
    testCases: fsTestCases,
    information: fsInformation,
    links: fsLinks,
    saveLinks,
  } = useFileSystem();

  const { currentProject } = useProject();

  // Global state mirrors filesystem state
  const [globalRequirements, setGlobalRequirements] = useState<Requirement[]>([]);
  const [globalUseCases, setGlobalUseCases] = useState<UseCase[]>([]);
  const [globalTestCases, setGlobalTestCases] = useState<TestCase[]>([]);
  const [globalInformation, setGlobalInformation] = useState<Information[]>([]);
  const [links, setLinksState] = useState<Link[]>([]);

  // Project-filtered state
  const [requirements, setRequirementsState] = useState<Requirement[]>([]);
  const [useCases, setUseCasesState] = useState<UseCase[]>([]);
  const [testCases, setTestCasesState] = useState<TestCase[]>([]);
  const [information, setInformationState] = useState<Information[]>([]);

  const isResetting = useRef(false);

  // Sync global state from filesystem
  useEffect(() => {
    setGlobalRequirements(fsRequirements);
  }, [fsRequirements]);

  useEffect(() => {
    setGlobalUseCases(fsUseCases);
  }, [fsUseCases]);

  useEffect(() => {
    setGlobalTestCases(fsTestCases);
  }, [fsTestCases]);

  useEffect(() => {
    setGlobalInformation(fsInformation);
  }, [fsInformation]);

  useEffect(() => {
    setLinksState(fsLinks);
  }, [fsLinks]);

  // Filter artifacts by current project
  useEffect(() => {
    if (currentProject) {
      setRequirementsState(
        globalRequirements.filter((r) => currentProject.requirementIds.includes(r.id))
      );
      setUseCasesState(globalUseCases.filter((u) => currentProject.useCaseIds.includes(u.id)));
      setTestCasesState(globalTestCases.filter((t) => currentProject.testCaseIds.includes(t.id)));
      setInformationState(
        globalInformation.filter((i) => currentProject.informationIds.includes(i.id))
      );
    } else {
      // No project selected - show all artifacts
      setRequirementsState(globalRequirements);
      setUseCasesState(globalUseCases);
      setTestCasesState(globalTestCases);
      setInformationState(globalInformation);
    }
  }, [currentProject, globalRequirements, globalUseCases, globalTestCases, globalInformation]);

  // Links setter that saves to disk
  const setLinks = useCallback(
    (linksOrFn: Link[] | ((prev: Link[]) => Link[])) => {
      setLinksState((prev) => {
        const newLinks = typeof linksOrFn === 'function' ? linksOrFn(prev) : linksOrFn;
        // Save to disk asynchronously
        saveLinks(newLinks).catch((err) => console.error('Failed to save links:', err));
        return newLinks;
      });
    },
    [saveLinks]
  );

  // Wrapper setters for requirements (update global state)
  const setRequirements = useCallback(
    (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => {
      setGlobalRequirements((prev) => {
        const newReqs = typeof reqs === 'function' ? reqs(prev) : reqs;
        return newReqs;
      });
    },
    []
  );

  const setUseCases = useCallback((ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => {
    setGlobalUseCases((prev) => {
      const newUcs = typeof ucs === 'function' ? ucs(prev) : ucs;
      return newUcs;
    });
  }, []);

  const setTestCases = useCallback((tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => {
    setGlobalTestCases((prev) => {
      const newTcs = typeof tcs === 'function' ? tcs(prev) : tcs;
      return newTcs;
    });
  }, []);

  const setInformation = useCallback(
    (info: Information[] | ((prev: Information[]) => Information[])) => {
      setGlobalInformation((prev) => {
        const newInfo = typeof info === 'function' ? info(prev) : info;
        return newInfo;
      });
    },
    []
  );

  const value: GlobalStateContextValue = {
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    links,
    setLinks,
    requirements,
    setRequirements,
    useCases,
    setUseCases,
    testCases,
    setTestCases,
    information,
    setInformation,
    isResetting,
  };

  return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
};

export const useGlobalState = (): GlobalStateContextValue => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
