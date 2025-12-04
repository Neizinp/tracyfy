import { closestCenter } from '@dnd-kit/core';
import { useDragDrop, useUI } from '../providers';

export function useAppDragDrop() {
    const dnd = useDragDrop();
    const { globalLibrarySelection } = useUI();

    return {
        contextProps: {
            sensors: dnd.sensors,
            collisionDetection: closestCenter,
            onDragStart: dnd.handleDragStart,
            onDragEnd: dnd.handleDragEnd,
        },

        renderOverlay: () => {
            if (!dnd.activeDragItem) return null;

            return (
                <div style={{
                    padding: '12px',
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-accent)',
                    borderRadius: '6px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    width: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {globalLibrarySelection.has(dnd.activeDragItem.id) &&
                        globalLibrarySelection.size > 1 && (
                            <div style={{
                                backgroundColor: 'var(--color-accent)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                {globalLibrarySelection.size}
                            </div>
                        )}
                    <div>
                        <div style={{ fontWeight: 500 }}>{dnd.activeDragItem.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {dnd.activeDragItem.id}
                        </div>
                    </div>
                </div>
            );
        }
    };
}
