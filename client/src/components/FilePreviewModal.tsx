'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/Modal';
import { AlertCircle, Download, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { resourcesApi } from '@/lib/api';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  resourceId?: string;
  fileName?: string;
  subject?: string;
  branch?: string;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  title,
  fileUrl,
  resourceId,
  fileName,
  subject,
  branch,
}: FilePreviewModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [viewMode, setViewMode] = useState<'google' | 'direct'>('google');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Reset state whenever the modal opens or viewMode changes
  useEffect(() => {
    if (!isOpen) return;
    setIframeLoaded(false);
    setLoadFailed(false);
    clearTimer();

    // Fallback: if iframe has not loaded in 12 seconds, show error state
    timeoutRef.current = setTimeout(() => {
      setLoadFailed(true);
    }, 12000);

    return clearTimer;
  }, [isOpen, viewMode]);

  if (!fileUrl) return null;

  const downloadTargetUrl = resourceId ? resourcesApi.getDownloadUrl(resourceId) : fileUrl;

  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  const inlineUrl =
    fileUrl.includes('cloudinary') && fileUrl.toLowerCase().endsWith('.pdf')
      ? fileUrl.replace('/raw/upload/', '/raw/upload/fl_inline/')
      : fileUrl;

  const currentIframeSrc = viewMode === 'google' ? googleViewerUrl : inlineUrl;

  const handleLoad = () => {
    clearTimer();
    setIframeLoaded(true);
    setLoadFailed(false);
  };

  const handleError = () => {
    clearTimer();
    setLoadFailed(true);
  };

  const switchMode = () => {
    setViewMode((m) => (m === 'google' ? 'direct' : 'google'));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${title}`} maxWidth="max-w-4xl">
      <div className="space-y-3">
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}
            >
              <FileText size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {subject ? `${subject} - ` : ''}
                {branch ? `${branch} - ` : ''}
                {fileName || 'Document File'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={switchMode}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
              title="Switch viewer engine"
            >
              Engine: {viewMode === 'google' ? 'Google Viewer' : 'Direct Embed'}
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <ExternalLink size={14} /> Open Link
            </a>
            <a
              href={downloadTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Download size={14} /> Download File
            </a>
          </div>
        </div>

        <div
          className="w-full h-[65vh] rounded-lg overflow-hidden relative"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
        >
          {!iframeLoaded && !loadFailed && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3"
              style={{ background: 'var(--bg-primary)' }}
            >
              <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Loading document preview...
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This may take a moment</p>
            </div>
          )}

          {loadFailed && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4 p-6 text-center"
              style={{ background: 'var(--bg-primary)' }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'var(--danger-muted)' }}
              >
                <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  Preview unavailable
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {viewMode === 'google'
                    ? 'Google Viewer could not load this file. Try switching to Direct Embed or open the file directly.'
                    : 'Direct embed is blocked for this file type. Try Google Viewer or open the file directly.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={switchMode} className="btn-secondary text-xs py-1.5 px-4 flex items-center gap-1.5">
                  <RefreshCw size={13} />
                  Try {viewMode === 'google' ? 'Direct Embed' : 'Google Viewer'}
                </button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> Open File
                </a>
              </div>
            </div>
          )}

          <iframe
            key={currentIframeSrc}
            src={currentIframeSrc}
            className="w-full h-full border-none"
            title={`Document Preview - ${title}`}
            onLoad={handleLoad}
            onError={handleError}
            allow="fullscreen"
            style={{ display: loadFailed ? 'none' : 'block' }}
          />
        </div>
      </div>
    </Modal>
  );
}
