import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
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
} from '../../types';

export interface GlobalStateContextValue {
  // Global artifacts (all artifacts regardless of project)
  globalRequirements: Requirement[];
  globalUseCases: UseCase[];
  globalTestCases: TestCase[];
  globalInformation: Information[];
  globalRisks: Risk[];
  globalDocuments: ArtifactDocument[];

  // Local project artifacts (filtered by current project)
  requirements: Requirement[];
  setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
  useCases: UseCase[];
  setUseCases: (ucs: UseCase[] | ((prev: UseCase[]) => UseCase[])) => void;
  testCases: TestCase[];
  setTestCases: (tcs: TestCase[] | ((prev: TestCase[]) => TestCase[])) => void;
  information: Information[];
  setInformation: (info: Information[] | ((prev: Information[]) => Information[])) => void;
  risks: Risk[];
  setRisks: (risks: Risk[] | ((prev: Risk[]) => Risk[])) => void;
  documents: ArtifactDocument[];
  setDocuments: (
    docs: ArtifactDocument[] | ((prev: ArtifactDocument[]) => ArtifactDocument[])
  ) => void;

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
    risks: fsRisks,
    documents: fsDocuments,
  } = useFileSystem();

  const { currentProject } = useProject();

  // Global state mirrors filesystem state
  const [globalRequirements, setGlobalRequirements] = useState<Requirement[]>([]);
  const [globalUseCases, setGlobalUseCases] = useState<UseCase[]>([]);
  const [globalTestCases, setGlobalTestCases] = useState<TestCase[]>([]);
  const [globalInformation, setGlobalInformation] = useState<Information[]>([]);
  const [globalRisks, setGlobalRisks] = useState<Risk[]>([]);
  const [globalDocuments, setGlobalDocuments] = useState<ArtifactDocument[]>([]);

  // Project-filtered state
  const [requirements, setRequirementsState] = useState<Requirement[]>([]);
  const [useCases, setUseCasesState] = useState<UseCase[]>([]);
  const [testCases, setTestCasesState] = useState<TestCase[]>([]);
  const [information, setInformationState] = useState<Information[]>([]);
  const [risks, setRisksState] = useState<Risk[]>([]);
  const [documents, setDocumentsState] = useState<ArtifactDocument[]>([]);

  const isResetting = useRef(false);

  // Sync global state from filesystem
  useEffect(() => {
    setGlobalRequirements(fsRequirements || []);
  }, [fsRequirements]);

  useEffect(() => {
    setGlobalUseCases(fsUseCases || []);
  }, [fsUseCases]);

  useEffect(() => {
    setGlobalTestCases(fsTestCases || []);
  }, [fsTestCases]);

  useEffect(() => {
    setGlobalInformation(fsInformation || []);
  }, [fsInformation]);

  useEffect(() => {
    setGlobalRisks(fsRisks || []);
  }, [fsRisks]);

  useEffect(() => {
    setGlobalDocuments(fsDocuments || []);
  }, [fsDocuments]);

  // Filter artifacts by current project
  useEffect(() => {
    if (currentProject) {
      setRequirementsState(
        globalRequirements.filter((r) => currentProject.requirementIds?.includes(r.id))
      );
      setUseCasesState(globalUseCases.filter((u) => currentProject.useCaseIds?.includes(u.id)));
      setTestCasesState(globalTestCases.filter((t) => currentProject.testCaseIds?.includes(t.id)));
      setInformationState(
        globalInformation.filter((i) => currentProject.informationIds?.includes(i.id))
      );
      setRisksState(globalRisks.filter((r) => currentProject.riskIds?.includes(r.id)));
      setDocumentsState(
        globalDocuments.filter(
          (d) => d.projectId === currentProject.id || currentProject.documentIds?.includes(d.id)
        )
      );
    } else {
      // No project selected - show all artifacts
      setRequirementsState(globalRequirements);
      setUseCasesState(globalUseCases);
      setTestCasesState(globalTestCases);
      setInformationState(globalInformation);
      setRisksState(globalRisks);
      setDocumentsState(globalDocuments);
    }
  }, [
    currentProject,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalRisks,
    globalDocuments,
  ]);

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

  const setRisks = useCallback((rs: Risk[] | ((prev: Risk[]) => Risk[])) => {
    setGlobalRisks((prev) => {
      const newRs = typeof rs === 'function' ? rs(prev) : rs;
      return newRs;
    });
  }, []);

  const setDocuments = useCallback(
    (docs: ArtifactDocument[] | ((prev: ArtifactDocument[]) => ArtifactDocument[])) => {
      setGlobalDocuments((prev) => {
        const newDocs = typeof docs === 'function' ? docs(prev) : docs;
        return newDocs;
      });
    },
    []
  );

  const value: GlobalStateContextValue = {
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalRisks,
    globalDocuments,
    requirements,
    setRequirements,
    useCases,
    setUseCases,
    testCases,
    setTestCases,
    information,
    setInformation,
    risks,
    setRisks,
    documents,
    setDocuments,
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
