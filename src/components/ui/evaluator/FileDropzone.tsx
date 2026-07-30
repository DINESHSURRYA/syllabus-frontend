"use client";
import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  uploadedFile?: { name: string; size: number } | null;
  onFileSelect: (file: File) => Promise<void> | void;
  onUploadSuccess?: () => void;
  onError?: (errorMsg: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileDropzone({
  uploadedFile,
  onFileSelect,
  onUploadSuccess,
  onError,
  accept = ".json,application/json",
  maxSizeMB = 10,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      if (onError) onError(`File too large. Max ${maxSizeMB}MB allowed.`);
      return;
    }

    setIsUploading(true);
    if (onError) onError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 150);

    try {
      await onFileSelect(file);
      setProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        if (onUploadSuccess) onUploadSuccess();
      }, 500);
    } catch (err: any) {
      setIsUploading(false);
      if (onError) onError(err?.message || "File upload failed");
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Success State
  if (uploadedFile && !isUploading) {
    return (
      <div className="w-full max-w-[480px] h-[80px] bg-surface/5 border border-surface/20 rounded-xl flex items-center justify-between px-6 transition-all">
        <div className="flex items-center gap-4">
          <FileText className="text-accent w-6 h-6 shrink-0" />
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-surface font-medium truncate max-w-[200px]">{uploadedFile.name}</span>
            <span className="text-muted text-sm font-mono">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-success font-medium text-sm shrink-0">
          <CheckCircle2 className="w-5 h-5" />
          <span>Ready to begin.</span>
        </div>
      </div>
    );
  }

  // Uploading State
  if (isUploading) {
    return (
      <div className="w-full max-w-[480px] h-[280px] border-2 border-surface/20 rounded-xl flex flex-col items-center justify-center transition-all bg-surface/5">
        <UploadCloud className="w-10 h-10 text-accent mb-4 animate-bounce" />
        <p className="text-surface font-medium mb-4">Uploading your JSON file...</p>
        <div className="w-64 h-2 bg-surface/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    );
  }

  // Default Dropzone
  return (
    <div
      className={cn(
        "w-full max-w-[480px] h-[280px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
        isDragging ? "border-accent bg-accent/5 scale-[1.02]" : "border-surface/30 hover:border-surface hover:bg-surface/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleChange}
        accept={accept}
      />
      <div className="p-4 bg-surface/10 rounded-full mb-4">
        <UploadCloud className="w-8 h-8 text-surface" />
      </div>
      <p className="text-surface font-medium mb-1 text-center px-4">Drag and drop your JSON file, or click to browse</p>
      <p className="text-muted text-sm font-mono">JSON — up to {maxSizeMB}MB</p>
    </div>
  );
}

export default FileDropzone;
