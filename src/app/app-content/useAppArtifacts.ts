import {
    useGlobalState,
    useRequirements,
    useUseCases,
    useTestCases,
    useInformation
} from '../providers';

export function useAppArtifacts() {
    const globalState = useGlobalState();
    const requirements = useRequirements();
    const useCases = useUseCases();
    const testCases = useTestCases();
    const information = useInformation();

    return {
        // Global artifacts
        global: {
            requirements: globalState.globalRequirements,
            useCases: globalState.globalUseCases,
            testCases: globalState.globalTestCases,
            information: globalState.globalInformation,
        },

        // Local artifacts
        local: {
            requirements: globalState.requirements,
            useCases: globalState.useCases,
            testCases: globalState.testCases,
            information: globalState.information,
            links: globalState.links,
        },

        // Setters (for handlers that need them)
        setters: {
            requirements: globalState.setRequirements,
            useCases: globalState.setUseCases,
            testCases: globalState.setTestCases,
            information: globalState.setInformation,
            links: globalState.setLinks,
        },

        // Operations
        operations: {
            requirements,
            useCases,
            testCases,
            information,
        }
    };
}
