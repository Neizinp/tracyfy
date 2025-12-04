import { useState } from 'react';
import type { Requirement, UseCase, TestCase, Information, Link, Project, Version } from '../types';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { createVersionSnapshot as createVersion } from '../utils/versionManagement';
import { gitService } from '../services/gitService';

interface UseDragAndDropProps {
    requirements: Requirement[];
    setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
    globalRequirements: Requirement[];
    globalUseCases: UseCase[];
    globalTestCases: TestCase[];
    globalInformation: Information[];
    globalLibrarySelection: Set<string>;
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    links: Link[];
    currentProjectId: string;
    projects: Project[];
    setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
    setVersions: (versions: Version[] | ((prev: Version[]) => Version[])) => void;
    handleAddToProject: (artifacts: any, targetProjectId: string) => void;
}

export function useDragAndDrop({
    requirements,
    setRequirements,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalLibrarySelection,
    useCases,
    testCases,
    information,
    links,
    currentProjectId,
    projects,
    setProjects,
    setVersions,
    handleAddToProject
}: UseDragAndDropProps) {

    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px of movement before dragging starts
            },
        }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragItem(event.active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        // Case 0: Dragging from Global Library to Project Sidebar
        if (active.data.current?.type === 'global-item' && over.data.current?.type === 'project-target') {
            const targetProjectId = over.data.current.projectId;
            const draggedId = active.data.current.id;
            const itemType = active.data.current.itemType; // 'requirement', 'usecase', etc.

            // Determine items to add
            const itemsToAdd = {
                requirements: [] as string[],
                useCases: [] as string[],
                testCases: [] as string[],
                information: [] as string[]
            };

            // If dragged item is in selection, add all selected items
            if (globalLibrarySelection.has(draggedId)) {
                // We need to know the type of each selected item.
                // Since selection is just IDs, we have to look them up.
                // Or we can just try to find them in each list.
                globalLibrarySelection.forEach(id => {
                    if (globalRequirements.find(r => r.id === id)) itemsToAdd.requirements.push(id);
                    else if (globalUseCases.find(u => u.id === id)) itemsToAdd.useCases.push(id);
                    else if (globalTestCases.find(t => t.id === id)) itemsToAdd.testCases.push(id);
                    else if (globalInformation.find(i => i.id === id)) itemsToAdd.information.push(id);
                });
            } else {
                // Add only the dragged item
                if (itemType === 'requirement') itemsToAdd.requirements.push(draggedId);
                else if (itemType === 'usecase') itemsToAdd.useCases.push(draggedId);
                else if (itemType === 'testcase') itemsToAdd.testCases.push(draggedId);
                else if (itemType === 'information') itemsToAdd.information.push(draggedId);
            }

            handleAddToProject(itemsToAdd, targetProjectId);

            // Clear selection after drop? Maybe not, user might want to drag to another project.
            // But usually drag and drop implies "done".
            // Let's keep selection for now.
            return;
        }

        // Case 1: Dragging from Global Library to Requirement Tree (Current Project)
        if (active.data.current?.type === 'global-item' && active.data.current?.itemType === 'requirement') {
            const reqId = active.data.current.id;

            // Check if already exists
            if (requirements.some(r => r.id === reqId)) {
                alert('This requirement is already in the project.');
                return;
            }

            // Find the requirement to import
            const globalReq = globalRequirements.find(r => r.id === reqId);
            if (globalReq) {
                // Clone and clear parents to make it a root item in this project
                const reqToImport = { ...globalReq, parentIds: [] };

                // Import it
                setRequirements(prev => [...prev, reqToImport]);

                // Update project
                setProjects(prev => prev.map(p =>
                    p.id === currentProjectId
                        ? { ...p, requirementIds: [...p.requirementIds, reqId], lastModified: Date.now() }
                        : p
                ));

                const newVersion = await createVersion(
                    currentProjectId,
                    projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
                    `Imported ${reqId} via drag-and-drop`,
                    'auto-save',
                    requirements,
                    useCases,
                    testCases,
                    information,
                    links,
                    gitService
                );
                setVersions(prev => [newVersion, ...prev].slice(0, 50));
                console.log(`Successfully imported ${reqId}`);
            }
            return;
        }

        // Case 2: Reordering within Requirement Tree
        if (active.id !== over.id) {
            // We need to handle reordering. 
            // Since RequirementTree uses a flat list for SortableContext (in some places) or nested?
            // RequirementTree logic:
            // It calls onReorder(active.id, over.id).
            // We need to implement that logic here or pass it down.
            // BUT, RequirementTree previously had its own DndContext.
            // Now we are lifting it. So we must handle the reorder here.

            // Find indices
            const oldIndex = requirements.findIndex(r => r.id === active.id);
            const newIndex = requirements.findIndex(r => r.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // This is a simple reorder in the flat list. 
                // However, the Tree view implies hierarchy.
                // If we just reorder the flat list, does it affect the tree?
                // The tree is built from parentIds.
                // Reordering in the flat list might not change the tree structure unless we change parentIds.
                // OR, if the tree rendering depends on the order of the flat list (it usually does for siblings).

                setRequirements((items) => {
                    return arrayMove(items, oldIndex, newIndex);
                });
            }
        }
    };

    return {
        sensors,
        activeDragItem,
        handleDragStart,
        handleDragEnd
    };
}
