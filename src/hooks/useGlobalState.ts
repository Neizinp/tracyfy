import { useState, useEffect, useRef } from 'react';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Link,
  Project,
  ColumnVisibility,
} from '../types';
import { initializeUsedNumbers, USED_NUMBERS_KEY } from '../utils/appInitialization';

interface UseGlobalStateProps {
  projects: Project[];
  currentProjectId: string;
  initialGlobalState: any;
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  setHasInitializedProjects: (initialized: boolean) => void;
  getDefaultColumnVisibility: () => ColumnVisibility;
  setColumnVisibility: (visibility: ColumnVisibility) => void;
}

export function useGlobalState({
  projects,
  currentProjectId,
  initialGlobalState,
  setProjects,
  setHasInitializedProjects,
  getDefaultColumnVisibility,
  setColumnVisibility,
}: UseGlobalStateProps) {
  // Global State
  const [globalRequirements, setGlobalRequirements] = useState<Requirement[]>([]);
  const [globalUseCases, setGlobalUseCases] = useState<UseCase[]>([]);
  const [globalTestCases, setGlobalTestCases] = useState<TestCase[]>([]);
  const [globalInformation, setGlobalInformation] = useState<Information[]>([]);
  const [links, setLinks] = useState<Link[]>([]); // Links are global

  // Local View State
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [information, setInformation] = useState<Information[]>([]);

  // Used Numbers State
  const [usedReqNumbers, setUsedReqNumbers] = useState<Set<number>>(new Set());
  const [usedUcNumbers, setUsedUcNumbers] = useState<Set<number>>(new Set());
  const [usedTestNumbers, setUsedTestNumbers] = useState<Set<number>>(new Set());
  const [usedInfoNumbers, setUsedInfoNumbers] = useState<Set<number>>(new Set());

  // Refs
  const isInitialMount = useRef(true);
  const isResetting = useRef(false);
  const hasInitialized = useRef(false);

  // Initialize Global State from ProjectManager (LocalStorage/Demo)
  useEffect(() => {
    if (initialGlobalState && !hasInitialized.current && projects.length > 0) {
      const newGlobalReqs = initialGlobalState.requirements || [];
      const newGlobalUCs = initialGlobalState.useCases || [];
      const newGlobalTCs = initialGlobalState.testCases || [];
      const newGlobalInfo = initialGlobalState.information || [];
      const newLinks = initialGlobalState.links || [];

      setGlobalRequirements(newGlobalReqs);
      setGlobalUseCases(newGlobalUCs);
      setGlobalTestCases(newGlobalTCs);
      setGlobalInformation(newGlobalInfo);
      setLinks(newLinks);

      // Also update local state for the current project immediately
      const project = projects.find((p) => p.id === currentProjectId);
      if (project) {
        setRequirements(
          newGlobalReqs.filter((r: Requirement) => project.requirementIds.includes(r.id))
        );
        setUseCases(newGlobalUCs.filter((u: UseCase) => project.useCaseIds.includes(u.id)));
        setTestCases(newGlobalTCs.filter((t: TestCase) => project.testCaseIds.includes(t.id)));
        setInformation(
          newGlobalInfo.filter((i: Information) => project.informationIds.includes(i.id))
        );

        // Initialize used numbers
        const newUsedNumbers = initializeUsedNumbers(
          newGlobalReqs.filter((r: Requirement) => project.requirementIds.includes(r.id)),
          newGlobalUCs.filter((u: UseCase) => project.useCaseIds.includes(u.id))
        );
        setUsedReqNumbers(newUsedNumbers.usedReqNumbers);
        setUsedUcNumbers(newUsedNumbers.usedUcNumbers);

        // Explicitly update and save the current project with correct artifact IDs
        const currentReqIds = newGlobalReqs
          .filter((r: Requirement) => project.requirementIds.includes(r.id))
          .map((r: Requirement) => r.id);
        const currentUcIds = newGlobalUCs
          .filter((u: UseCase) => project.useCaseIds.includes(u.id))
          .map((u: UseCase) => u.id);
        const currentTcIds = newGlobalTCs
          .filter((t: TestCase) => project.testCaseIds.includes(t.id))
          .map((t: TestCase) => t.id);
        const currentInfoIds = newGlobalInfo
          .filter((i: Information) => project.informationIds.includes(i.id))
          .map((i: Information) => i.id);

        const updatedProjects = projects.map((p) =>
          p.id === currentProjectId
            ? {
                ...p,
                requirementIds: currentReqIds,
                useCaseIds: currentUcIds,
                testCaseIds: currentTcIds,
                informationIds: currentInfoIds,
                lastModified: Date.now(),
              }
            : p
        );
        setProjects(updatedProjects);
        localStorage.setItem('reqtrace-projects', JSON.stringify(updatedProjects));
      }
      hasInitialized.current = true;
      setHasInitializedProjects(true);
    }
  }, [initialGlobalState, projects, currentProjectId, setHasInitializedProjects, setProjects]);

  // Update local state when project changes
  useEffect(() => {
    const project = projects.find((p) => p.id === currentProjectId);
    if (project) {
      setRequirements(globalRequirements.filter((r) => project.requirementIds.includes(r.id)));
      setUseCases(globalUseCases.filter((u) => project.useCaseIds.includes(u.id)));
      setTestCases(globalTestCases.filter((t) => project.testCaseIds.includes(t.id)));
      setInformation(globalInformation.filter((i) => project.informationIds.includes(i.id)));

      // Update used numbers
      const newUsedNumbers = initializeUsedNumbers(
        globalRequirements.filter((r) => project.requirementIds.includes(r.id)),
        globalUseCases.filter((u) => project.useCaseIds.includes(u.id))
      );
      setUsedReqNumbers(newUsedNumbers.usedReqNumbers);
      setUsedUcNumbers(newUsedNumbers.usedUcNumbers);

      // Load column visibility
      try {
        const saved = localStorage.getItem(`column-visibility-${currentProjectId}`);
        if (saved) {
          setColumnVisibility({ ...getDefaultColumnVisibility(), ...JSON.parse(saved) });
        } else {
          setColumnVisibility(getDefaultColumnVisibility());
        }
      } catch (e) {
        console.error('Failed to load column visibility', e);
      }
    }
  }, [currentProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync local state back to Global State and Projects
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!hasInitialized.current) {
      return;
    }

    // 1. Update Global State (Upsert)
    setGlobalRequirements((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      requirements.forEach((r) => map.set(r.id, r));
      return Array.from(map.values());
    });
    setGlobalUseCases((prev) => {
      const map = new Map(prev.map((u) => [u.id, u]));
      useCases.forEach((u) => map.set(u.id, u));
      return Array.from(map.values());
    });
    setGlobalTestCases((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      testCases.forEach((t) => map.set(t.id, t));
      return Array.from(map.values());
    });
    setGlobalInformation((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      information.forEach((i) => map.set(i.id, i));
      return Array.from(map.values());
    });

    // 2. Update Project IDs
    setProjects((prevProjects: Project[]) =>
      prevProjects.map((p: Project) =>
        p.id === currentProjectId
          ? {
              ...p,
              requirementIds: requirements.map((r) => r.id),
              useCaseIds: useCases.map((u) => u.id),
              testCaseIds: testCases.map((t) => t.id),
              informationIds: information.map((i) => i.id),
              lastModified: Date.now(),
            }
          : p
      )
    );
  }, [requirements, useCases, testCases, information, currentProjectId]);

  // Persist Global State to localStorage
  useEffect(() => {
    if (isResetting.current) return;

    if (
      globalRequirements.length === 0 &&
      globalUseCases.length === 0 &&
      globalTestCases.length === 0 &&
      globalInformation.length === 0
    ) {
      return;
    }

    const globalState = {
      requirements: globalRequirements,
      useCases: globalUseCases,
      testCases: globalTestCases,
      information: globalInformation,
      links: links,
    };
    localStorage.setItem('reqtrace-global-state', JSON.stringify(globalState));
  }, [globalRequirements, globalUseCases, globalTestCases, globalInformation, links]);

  // Auto-save used numbers
  useEffect(() => {
    try {
      const usedNumbersToSave = {
        usedReqNumbers: Array.from(usedReqNumbers),
        usedUcNumbers: Array.from(usedUcNumbers),
      };
      localStorage.setItem(USED_NUMBERS_KEY, JSON.stringify(usedNumbersToSave));
    } catch (error) {
      console.error('Failed to save used numbers:', error);
    }
  }, [usedReqNumbers, usedUcNumbers]);

  // Migrate legacy versions
  useEffect(() => {}, []);

  return {
    // Global Data
    globalRequirements,
    setGlobalRequirements,
    globalUseCases,
    setGlobalUseCases,
    globalTestCases,
    setGlobalTestCases,
    globalInformation,
    setGlobalInformation,
    links,
    setLinks,

    // Local Data
    requirements,
    setRequirements,
    useCases,
    setUseCases,
    testCases,
    setTestCases,
    information,
    setInformation,

    // Used Numbers
    usedReqNumbers,
    setUsedReqNumbers,
    usedUcNumbers,
    setUsedUcNumbers,
    usedTestNumbers,
    setUsedTestNumbers,
    usedInfoNumbers,
    setUsedInfoNumbers,

    // Refs
    isResetting,
  };
}
