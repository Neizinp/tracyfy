import type { Requirement, UseCase, TestCase, Information, Link, Project, Version } from '../types';
import { createVersionSnapshot as createVersion } from '../utils/versionManagement';
import { gitService } from '../services/gitService';

interface UseAppHandlersProps {
    projects: Project[];
    currentProjectId: string;
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    links: Link[];
    globalRequirements: Requirement[];
    globalUseCases: UseCase[];
    globalTestCases: TestCase[];
    globalInformation: Information[];
    setRequirements: (reqs: Requirement[]) => void;
    setUseCases: (ucs: UseCase[]) => void;
    setTestCases: (tcs: TestCase[]) => void;
    setInformation: (info: Information[]) => void;
    setLinks: (links: Link[]) => void;
    setVersions: (updater: (prev: Version[]) => Version[]) => void;
    handleAddToProjectInternal: (artifacts: any, targetProjectId?: string) => Promise<void>;
    setGlobalLibrarySelection: (updater: (prev: Set<string>) => Set<string>) => void;
    setActiveLibraryTab: (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => void;
    setIsLibraryPanelOpen: (isOpen: boolean) => void;
    setIsNewRequirementModalOpen: (isOpen: boolean) => void;
    setSelectedRequirementId: (id: string | null) => void;
    setIsLinkModalOpen: (isOpen: boolean) => void;
    setEditingRequirement: (req: Requirement | null) => void;
    setIsEditRequirementModalOpen: (isOpen: boolean) => void;
}

export function useAppHandlers({
    projects,
    currentProjectId,
    requirements,
    useCases,
    testCases,
    information,
    links,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    setRequirements,
    setUseCases,
    setTestCases,
    setInformation,
    setLinks,
    setVersions,
    handleAddToProjectInternal,
    setGlobalLibrarySelection,
    setActiveLibraryTab,
    setIsLibraryPanelOpen,
    setIsNewRequirementModalOpen,
    setSelectedRequirementId,
    setIsLinkModalOpen,
    setEditingRequirement,
    setIsEditRequirementModalOpen
}: UseAppHandlersProps) {

    const handleAddToProject = async (
        artifacts: { requirements: string[], useCases: string[], testCases: string[], information: string[] },
        targetProjectId: string = currentProjectId
    ) => {
        await handleAddToProjectInternal(artifacts, targetProjectId);

        // Also update local state to reflect changes immediately IF it's the current project
        if (targetProjectId === currentProjectId) {
            // Filter global artifacts by the new IDs
            const newReqs = globalRequirements.filter(r => artifacts.requirements.includes(r.id) || requirements.some(existing => existing.id === r.id));
            const newUCs = globalUseCases.filter(u => artifacts.useCases.includes(u.id) || useCases.some(existing => existing.id === u.id));
            const newTCs = globalTestCases.filter(t => artifacts.testCases.includes(t.id) || testCases.some(existing => existing.id === t.id));
            const newInfo = globalInformation.filter(i => artifacts.information.includes(i.id) || information.some(existing => existing.id === i.id));

            setRequirements(newReqs);
            setUseCases(newUCs);
            setTestCases(newTCs);
            setInformation(newInfo);
        }

        const newVersion = await createVersion(
            currentProjectId,
            projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
            'Added artifacts from Global Library',
            'auto-save',
            requirements,
            useCases,
            testCases,
            information,
            links,
            gitService
        );
        setVersions(prev => [newVersion, ...prev].slice(0, 50));
    };

    const handleGlobalLibrarySelect = (id: string) => {
        setGlobalLibrarySelection(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleOpenLibrary = (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => {
        setActiveLibraryTab(tab);
        setIsLibraryPanelOpen(true);
    };

    const handleBreakDownUseCase = (_useCase: UseCase) => {
        // Open new requirement modal with use case pre-selected
        // For now, just open the modal - user can manually link
        setIsNewRequirementModalOpen(true);
    };

    const handleLink = (sourceId: string) => {
        setSelectedRequirementId(sourceId);
        setIsLinkModalOpen(true);
    };

    const handleAddLink = (linkData: Omit<Link, 'id'>) => {
        const newLink: Link = {
            ...linkData,
            id: `LINK-${Date.now()}`
        };
        setLinks([...links, newLink]);
        setIsLinkModalOpen(false);
        setSelectedRequirementId(null);
    };

    const handleEdit = (requirement: Requirement) => {
        setEditingRequirement(requirement);
        setIsEditRequirementModalOpen(true);
    };

    return {
        handleAddToProject,
        handleGlobalLibrarySelect,
        handleOpenLibrary,
        handleBreakDownUseCase,
        handleLink,
        handleAddLink,
        handleEdit
    };
}
