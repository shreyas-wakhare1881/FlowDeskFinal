'use client';

import { useState, useRef } from 'react';

interface FileUploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  files: FileUploadedFile[];
  onFilesChange: (files: FileUploadedFile[]) => void;
}

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: FileUploadedFile[] = newFiles.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      type: file.type || file.name.split('.').pop() || 'unknown',
    }));
    onFilesChange([...files, ...uploadedFiles]);
  };

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      pdf: '📄',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      xlsx: '📊',
      xls: '📊',
      docx: '📝',
      doc: '📝',
    };
    return icons[ext || ''] || '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center text-2xl shadow-md">
          📎
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">Attachments</h3>
          <p className="text-sm text-slate-500">PDF, Images, Excel — Max 20MB each</p>
        </div>
        {files.length > 0 && (
          <div className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-200">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all overflow-hidden group
          ${
            isDragging
              ? 'border-blue-400 bg-blue-50 scale-105'
              : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-102'
          }
        `}
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative z-10">
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📁</div>
          <p className="text-sm font-bold text-slate-700 mb-2">
            Drag & drop files here or <span className="text-blue-600 underline">browse</span>
          </p>
          <p className="text-xs text-slate-500 mb-4">PDF, PNG, JPG, XLSX, DOCX supported</p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Max 20MB</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span>Multiple files</span>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 group hover:from-white hover:to-slate-50 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {getFileIcon(file.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-medium">{formatFileSize(file.size)}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Uploaded
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-2 border-transparent transition-all opacity-0 group-hover:opacity-100"
                title="Remove file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
