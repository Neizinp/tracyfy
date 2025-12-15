import { useState, useEffect } from 'react';
import { assetService } from '../services/assetService';

interface AssetImageProps {
  src?: string;
  alt?: string;
  style?: React.CSSProperties;
}

/**
 * Image component that loads local assets from the file system
 * Handles ./assets/... paths by converting them to blob URLs
 */
export const AssetImage: React.FC<AssetImageProps> = ({ src, alt, style }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) return;

      // Check if it's a local asset path
      if (src.startsWith('./assets/') || src.startsWith('assets/')) {
        setLoading(true);
        setError(false);
        try {
          const url = await assetService.getAssetUrl(src);
          if (isMounted) {
            if (url) {
              setBlobUrl(url);
            } else {
              setError(true);
            }
          }
        } catch (err) {
          console.error('Failed to load asset:', err);
          if (isMounted) {
            setError(true);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        // External URL, use directly
        setBlobUrl(src);
      }
    };

    loadImage();

    // Cleanup blob URL on unmount
    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (loading) {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '8px 12px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '4px',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        Loading image...
      </span>
    );
  }

  if (error || !blobUrl) {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '8px 12px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '4px',
          color: 'var(--color-status-rejected)',
          fontSize: 'var(--font-size-xs)',
        }}
      >
        Image not found: {alt || src}
      </span>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt || 'Image'}
      style={{
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '4px',
        margin: '8px 0',
        ...style,
      }}
    />
  );
};
