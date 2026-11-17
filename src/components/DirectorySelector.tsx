import React from 'react';
import { Folder, AlertCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../state';
import { fileSystemService } from '../services/fileSystemService';

interface DirectorySelectorProps {
  onReady?: () => void;
}

export const DirectorySelector: React.FC<DirectorySelectorProps> = ({ onReady }) => {
  const isReady = useAppStore((s) => s.isReady);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.folderError);
  const selectDirectory = useAppStore((s) => s.selectFolder);
  const directoryName = useAppStore((s) => s.directoryName);
  const isApiSupported = fileSystemService.isSupported();

  React.useEffect(() => {
    if (isReady && onReady) {
      onReady();
    }
  }, [isReady, onReady]);

  // Don't render when ready
  if (isReady) {
    return null;
  }

  // Show loading spinner during initial restore (prevents "No directory" flicker)
  if (isLoading && !directoryName && !error) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--color-bg-app)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <Loader2
          size={48}
          style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '48px',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Folder size={40} style={{ color: 'var(--color-accent)' }} />
        </div>

        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '12px',
          }}
        >
          Select Project Directory
        </h1>

        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginBottom: '32px',
            lineHeight: 1.6,
          }}
        >
          Choose a folder to store your requirements data. All files will be saved as Markdown and
          tracked with Git.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
              {error}
            </span>
          </div>
        )}

        {directoryName && (
          <div
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Folder size={20} style={{ color: 'var(--color-success)' }} />
            <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {directoryName}
            </span>
          </div>
        )}

        {isApiSupported && (
          <>
            <button
              onClick={selectDirectory}
              disabled={isLoading}
              style={{
                padding: '14px 32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-base)',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Loading...
                </>
              ) : (
                <>
                  <Folder size={20} />
                  Choose Folder
                </>
              )}
            </button>

            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-xs)',
                marginTop: '24px',
              }}
            >
              Tip: You can use an existing Git repository or we'll initialize one for you.
            </p>
          </>
        )}
      </div>

      <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  );
};
