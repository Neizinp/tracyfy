import { useState, useRef, useCallback, useEffect, useContext } from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Eye, Edit2, ImagePlus } from 'lucide-react';
import { assetService } from '../services/assetService';
import { AssetImage } from './AssetImage';
import { FileSystemContext } from '../app/providers/FileSystemProvider';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  height?: number;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  label,
  height = 200,
  placeholder = 'Enter text with Markdown formatting...',
}) => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  // Use optional context - may be null if not inside FileSystemProvider (e.g., in tests)
  const fileSystemContext = useContext(FileSystemContext);
  const refreshStatus = fileSystemContext?.refreshStatus;

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        console.warn('Only image files are supported');
        return;
      }
      setIsUploading(true);
      try {
        const assetPath = await assetService.uploadAsset(file);
        // Insert markdown image at cursor/end
        const imageMarkdown = `![${file.name}](${assetPath})`;
        onChange(value + '\n' + imageMarkdown);
        // Refresh git status so the new asset appears in pending changes
        await refreshStatus?.();
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange, refreshStatus]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFileUpload]
  );

  // Handle paste from clipboard
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            setIsUploading(true);
            try {
              const assetPath = await assetService.uploadAssetFromBlob(blob, 'pasted-image.png');
              const imageMarkdown = `![pasted image](${assetPath})`;
              onChange(value + '\n' + imageMarkdown);
              // Refresh git status so the new asset appears in pending changes
              await refreshStatus?.();
            } catch (error) {
              console.error('Failed to paste image:', error);
            } finally {
              setIsUploading(false);
            }
          }
          break;
        }
      }
    },
    [value, onChange, refreshStatus]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          await handleFileUpload(file);
        }
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Set up paste and drag-drop listeners
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const pasteHandler = handlePaste as unknown as EventListener;
    const dropHandler = handleDrop as unknown as EventListener;
    const dragOverHandler = handleDragOver as unknown as EventListener;
    const dragEnterHandler = handleDragEnter as unknown as EventListener;

    // Use capture phase to ensure we get the event before the browser
    container.addEventListener('paste', pasteHandler);
    container.addEventListener('drop', dropHandler, { capture: true });
    container.addEventListener('dragover', dragOverHandler, { capture: true });
    container.addEventListener('dragenter', dragEnterHandler, { capture: true });

    return () => {
      container.removeEventListener('paste', pasteHandler);
      container.removeEventListener('drop', dropHandler, { capture: true });
      container.removeEventListener('dragover', dragOverHandler, { capture: true });
      container.removeEventListener('dragenter', dragEnterHandler, { capture: true });
    };
  }, [handlePaste, handleDrop, handleDragOver, handleDragEnter]);

  return (
    <div className="markdown-editor-container" ref={editorContainerRef}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileInputChange}
      />

      {/* Toolbar - always shown */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        {label ? (
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            {label}
          </label>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Image upload button */}
          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              } else {
                console.error('File input ref not available');
              }
            }}
            disabled={isUploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              fontSize: 'var(--font-size-xs)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: isUploading ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: isUploading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              opacity: isUploading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              e.currentTarget.style.color = isUploading
                ? 'var(--color-text-muted)'
                : 'var(--color-text-secondary)';
            }}
            title={isUploading ? 'Uploading...' : 'Insert image (or paste/drag-drop)'}
          >
            <ImagePlus size={14} />
            {isUploading ? 'Uploading...' : 'Image'}
          </button>
          {/* Preview/Edit toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              fontSize: 'var(--font-size-xs)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            title={isEditMode ? 'Switch to Preview' : 'Switch to Edit'}
          >
            {isEditMode ? (
              <>
                <Eye size={14} />
                Preview
              </>
            ) : (
              <>
                <Edit2 size={14} />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {isEditMode ? (
        <div data-color-mode="dark">
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || '')}
            height={height}
            preview="edit"
            hideToolbar={false}
            enableScroll={true}
            commandsFilter={(cmd) => (cmd.name === 'image' ? false : cmd)}
            textareaProps={{
              placeholder: placeholder,
            }}
          />
        </div>
      ) : (
        <div
          className="markdown-preview"
          style={{
            minHeight: `${height}px`,
            maxHeight: `${height + 100}px`,
            overflowY: 'auto',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '12px',
            backgroundColor: 'var(--color-bg-app)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {value ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // Custom styling for rendered elements - smaller, consistent with app
                h1: ({ ...props }) => (
                  <h1
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: 'var(--color-text-primary)',
                    }}
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h2
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'bold',
                      marginBottom: '6px',
                      color: 'var(--color-text-primary)',
                    }}
                    {...props}
                  />
                ),
                h3: ({ ...props }) => (
                  <h3
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 'bold',
                      marginBottom: '6px',
                      color: 'var(--color-text-primary)',
                    }}
                    {...props}
                  />
                ),
                h4: ({ ...props }) => (
                  <h4
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      color: 'var(--color-text-primary)',
                    }}
                    {...props}
                  />
                ),
                p: ({ ...props }) => (
                  <p
                    style={{
                      marginBottom: '8px',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                    {...props}
                  />
                ),
                ul: ({ ...props }) => (
                  <ul
                    style={{
                      listStyle: 'disc',
                      listStylePosition: 'inside',
                      marginBottom: '8px',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                    {...props}
                  />
                ),
                ol: ({ ...props }) => (
                  <ol
                    style={{
                      listStyle: 'decimal',
                      listStylePosition: 'inside',
                      marginBottom: '8px',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                    {...props}
                  />
                ),
                li: ({ ...props }) => (
                  <li
                    style={{ color: 'var(--color-text-secondary)', marginBottom: '2px' }}
                    {...props}
                  />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote
                    style={{
                      borderLeft: '3px solid var(--color-accent)',
                      paddingLeft: '12px',
                      fontStyle: 'italic',
                      margin: '8px 0',
                      color: 'var(--color-text-muted)',
                    }}
                    {...props}
                  />
                ),
                code: ({ className, children, ...props }) => {
                  const inline = !className;
                  return inline ? (
                    <code
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-accent-light)',
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      style={{
                        display: 'block',
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: 'var(--font-size-sm)',
                        overflowX: 'auto',
                        margin: '8px 0',
                        color: 'var(--color-text-secondary)',
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ ...props }) => (
                  <pre
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      overflowX: 'auto',
                    }}
                    {...props}
                  />
                ),
                table: ({ ...props }) => (
                  <div style={{ overflowX: 'auto', marginBottom: '8px' }}>
                    <table
                      style={{
                        minWidth: '100%',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                      {...props}
                    />
                  </div>
                ),
                thead: ({ ...props }) => (
                  <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }} {...props} />
                ),
                th: ({ ...props }) => (
                  <th
                    style={{
                      border: '1px solid var(--color-border)',
                      padding: '8px',
                      textAlign: 'left',
                      color: 'var(--color-text-primary)',
                    }}
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td
                    style={{
                      border: '1px solid var(--color-border)',
                      padding: '8px',
                      color: 'var(--color-text-secondary)',
                    }}
                    {...props}
                  />
                ),
                // Custom image component for local assets
                img: ({ src, alt, ...props }) => <AssetImage src={src} alt={alt} {...props} />,
                a: ({ ...props }) => (
                  <a
                    style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}
                    {...props}
                  />
                ),
                strong: ({ ...props }) => (
                  <strong
                    style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}
                    {...props}
                  />
                ),
                em: ({ ...props }) => (
                  <em
                    style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}
                    {...props}
                  />
                ),
                hr: ({ ...props }) => (
                  <hr
                    style={{
                      margin: '12px 0',
                      border: 'none',
                      borderTop: '1px solid var(--color-border)',
                    }}
                    {...props}
                  />
                ),
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              No content
            </p>
          )}
        </div>
      )}
    </div>
  );
};
