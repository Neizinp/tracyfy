/**
 * Utility functions for version management and baseline snapshots.
 * Handles creating, loading, and saving version snapshots to localStorage.
 */

import type { Version, Requirement, UseCase, TestCase, Information, Link } from '../types';

const LEGACY_VERSIONS_KEY = 'reqtrace-versions';
const MAX_VERSIONS = 50;

/**
 * Get the localStorage key for a project's versions
 */
export function getVersionsKey(projectId: string): string {
    return `reqtrace-versions-${projectId}`;
}

/**
 * Load versions for a specific project from localStorage
 */
export function loadVersions(projectId: string): Version[] {
    try {
        const savedVersions = localStorage.getItem(getVersionsKey(projectId));
        if (savedVersions) {
            return JSON.parse(savedVersions);
        }
    } catch (error) {
        console.error('Failed to load versions:', error);
    }
    return [];
}

/**
 * Save versions for a specific project to localStorage
 */
export function saveVersions(projectId: string, versions: Version[]): void {
    try {
        const versionsKey = getVersionsKey(projectId);
        localStorage.setItem(versionsKey, JSON.stringify(versions));
    } catch (error) {
        console.error('Failed to save versions:', error);
    }
}

/**
 * Create a version snapshot of current project data
 */
export async function createVersionSnapshot(
    projectId: string,
    projectName: string,
    message: string,
    type: 'auto-save' | 'baseline',
    requirements: Requirement[],
    useCases: UseCase[],
    testCases: TestCase[],
    information: Information[],
    links: Link[],
    gitService: any,
    tag?: string
): Promise<Version> {
    // Create version object
    const newVersion: Version = {
        id: `v-${Date.now()}`,
        timestamp: Date.now(),
        message,
        type,
        tag,
        data: {
            requirements: JSON.parse(JSON.stringify(requirements)),
            useCases: JSON.parse(JSON.stringify(useCases)),
            links: JSON.parse(JSON.stringify(links)),
            testCases: JSON.parse(JSON.stringify(testCases)),
            information: JSON.parse(JSON.stringify(information))
        }
    };

    // If baseline, commit to Git
    if (type === 'baseline') {
        try {
            await gitService.commit(projectName, message);
            console.log('Committed baseline to Git:', message);
        } catch (error) {
            console.error('Failed to commit baseline to Git:', error);
        }
    }

    // Save to localStorage
    const currentVersions = loadVersions(projectId);
    const updatedVersions = [newVersion, ...currentVersions].slice(0, MAX_VERSIONS);
    saveVersions(projectId, updatedVersions);

    return newVersion;
}

/**
 * Migrate legacy global versions to current project (one-time migration)
 */
export function migrateLegacyVersions(currentProjectId: string): void {
    try {
        const legacyVersions = localStorage.getItem(LEGACY_VERSIONS_KEY);
        if (legacyVersions) {
            // Save to current project
            localStorage.setItem(getVersionsKey(currentProjectId), legacyVersions);
            // Remove legacy key
            localStorage.removeItem(LEGACY_VERSIONS_KEY);
            console.log('Migrated legacy versions to current project');
        }
    } catch (error) {
        console.error('Failed to migrate legacy versions:', error);
    }
}
