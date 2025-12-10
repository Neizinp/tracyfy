import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, AlertCircle, GripVertical, Link2, ArrowRight } from 'lucide-react';
import type { Requirement } from '../types';

interface RequirementTreeProps {
  requirements: Requirement[];
  allRequirements: Requirement[];
  onReorder: (activeId: string, overId: string) => void;
  onLink: (requirementId: string) => void;
  onEdit: (requirement: Requirement) => void;
}

interface SortableRequirementItemProps {
  req: Requirement;
  allRequirements: Requirement[];
  onReorder: (activeId: string, overId: string) => void;
  onLink: (requirementId: string) => void;
  onEdit: (requirement: Requirement) => void;
}

const SortableRequirementItem: React.FC<SortableRequirementItemProps> = ({
  req,
  allRequirements,
  onLink,
  onEdit,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: req.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: 1,
    marginBottom: '2px',
  };

  // Check if this requirement has multiple parents
  const originalReq = allRequirements.find((r) => r.id === req.id);
  const hasMultipleParents = originalReq && originalReq.parentIds.length > 1;

  // Get linked artifacts count from the requirement's linkedArtifacts
  const linkedArtifacts = req.linkedArtifacts || [];

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid transparent',
          position: 'relative',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            marginRight: '8px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <GripVertical size={14} />
        </div>

        <div
          style={{
            marginRight: '12px',
            color: 'var(--color-accent-light)',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          }}
        >
          {req.id}
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
            onEdit(req);
          }}
          style={{
            flex: 1,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'background-color 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')}
          title="Click to edit"
        >
          {req.title}
        </div>

        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor:
              req.priority === 'high' ? 'var(--color-bg-secondary)' : 'var(--color-bg-secondary)',
            color:
              req.priority === 'high' ? 'var(--color-error-light)' : 'var(--color-text-secondary)',
            marginRight: '12px',
          }}
        >
          {req.priority}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onLink(req.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            marginRight: '8px',
          }}
          title="Create Link"
        >
          <Link2 size={16} />
        </button>

        {/* Link Badge - now uses linkedArtifacts from the requirement */}
        {linkedArtifacts.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginRight: '8px',
              padding: '2px 6px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-bg-secondary)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-accent-light)',
            }}
            title={linkedArtifacts
              .map((link) => `→ ${link.targetId} (${link.type.replace('_', ' ')})`)
              .join('\n')}
          >
            <ArrowRight size={12} />
            {linkedArtifacts.length}
          </div>
        )}

        {/* Multi-Parent Indicator */}
        {hasMultipleParents && originalReq && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginRight: '8px',
              padding: '2px 6px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-bg-secondary)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-warning-light)',
            }}
            title={`Multiple parents: ${originalReq.parentIds.join(', ')}`}
          >
            ⚡ {originalReq.parentIds.length}
          </div>
        )}

        <div style={{ color: 'var(--color-text-muted)' }}>
          <FileText size={16} />
        </div>
      </div>
    </div>
  );
};

export const RequirementTree: React.FC<RequirementTreeProps> = ({
  requirements,
  allRequirements,
  onReorder,
  onLink,
  onEdit,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      onReorder(active.id as string, over!.id as string);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          padding: 'var(--spacing-sm)',
        }}
      >
        <SortableContext
          items={requirements.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {requirements.map((req) => (
            <SortableRequirementItem
              key={req.id}
              req={req}
              allRequirements={allRequirements}
              onReorder={onReorder}
              onLink={onLink}
              onEdit={onEdit}
            />
          ))}
        </SortableContext>

        {requirements.length === 0 && (
          <div
            style={{
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <AlertCircle size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 1 }} />
            <p>No requirements found. Create one to get started.</p>
          </div>
        )}
      </div>
    </DndContext>
  );
};
