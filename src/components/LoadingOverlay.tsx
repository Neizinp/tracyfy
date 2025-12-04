import React from 'react';

interface LoadingOverlayProps {
    isLoading: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--color-bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: '1.5rem',
                    color: 'var(--color-text-primary)',
                    marginBottom: '16px'
                }}>
                    Loading Project...
                </div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                    Initializing Git repository and loading artifacts
                </div>
            </div>
        </div>
    );
};
