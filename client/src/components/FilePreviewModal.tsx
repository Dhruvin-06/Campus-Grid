'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { Download, ExternalLink, FileText, RefreshCw } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'google' | 'direct'>('google');

  if (!fileUrl) return null;

  const downloadTargetUrl = resourceId ? resourcesApi.getDownloadUrl(resourceId) : fileUrl;

  // Use Google Docs viewer to embed documents without forcing download
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  
  // Inline PDF URL (adding fl_inline header for Cloudinary if raw PDF)
  const inlineUrl = fileUrl.includes('cloudinary') && fileUrl.endsWith('.pdf') 
    ? fileUrl.replace('/raw/upload/', '/raw/upload/fl_inline/') 
    : fileUrl;

  const currentIframeSrc = viewMode === 'google' ? googleViewerUrl : inlineUrl;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${title}`} maxWidth="max-w-4xl">
      <div className="space-y-3">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/20 text-indigo-400">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white line-clamp-1">{title}</p>
              <p className="text-xs text-slate-400">
                {subject ? `${subject} · ` : ''}{branch ? `${branch} · ` : ''}{fileName || 'Document File'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setViewMode(viewMode === 'google' ? 'direct' : 'google')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10"
              title="Switch Viewer engine"
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

        {/* Embedded Viewer Container */}
        <div className="w-full h-[65vh] rounded-xl overflow-hidden bg-slate-950 border border-white/10 relative flex flex-col items-center justify-center">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm z-10 text-center p-4">
              <RefreshCw size={24} className="animate-spin text-indigo-400 mb-2" />
              <p className="text-xs font-medium text-slate-300">Loading document preview…</p>
            </div>
          )}
          <iframe
            key={currentIframeSrc}
            src={currentIframeSrc}
            className="w-full h-full border-none"
            title={`Document Preview - ${title}`}
            onLoad={() => setIframeLoaded(true)}
            allow="fullscreen"
          />
        </div>
      </div>
    </Modal>
  );
}
