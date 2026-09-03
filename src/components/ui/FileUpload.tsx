"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onUpload: (files: File[]) => void;
  preview?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept = "image/*",
  maxSize = 5,
  onUpload,
  preview = true,
  label = "Drop files here or click to browse",
  error: propError,
  disabled = false,
  multiple = false,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = propError ?? error;

  const validateAndAdd = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const arr = Array.from(newFiles);
      const maxBytes = maxSize * 1024 * 1024;
      const oversized = arr.find((f) => f.size > maxBytes);
      if (oversized) {
        setError(`"${oversized.name}" exceeds ${maxSize} MB limit`);
        return;
      }
      const valid = arr.filter((f) => {
        if (!accept) return true;
        const exts = accept.split(",").map((e) => e.trim());
        return exts.some((ext) => {
          if (ext.startsWith(".")) return f.name.toLowerCase().endsWith(ext.toLowerCase());
          if (ext.endsWith("/*")) return f.type.startsWith(ext.replace("/*", ""));
          return f.type === ext;
        });
      });
      if (valid.length === 0) {
        setError("File type not accepted");
        return;
      }
      const updated = multiple ? [...files, ...valid] : valid;
      setFiles(updated);
      onUpload(updated);

      if (preview) {
        const newPreviews = valid.map((f) => {
          if (f.type.startsWith("image/")) return URL.createObjectURL(f);
          return "";
        });
        setPreviews((prev) =>
          multiple ? [...prev, ...newPreviews] : newPreviews
        );
      }
    },
    [files, maxSize, accept, multiple, preview, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!disabled) validateAndAdd(e.dataTransfer.files);
    },
    [disabled, validateAndAdd]
  );

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload(updated);
    if (previews[index]) URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter") inputRef.current?.click(); }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer",
          "px-6 py-10",
          dragging
            ? "border-green-500 bg-green-500/5"
            : "border-white/[0.12] hover:border-white/[0.22] bg-white/[0.02]",
          disabled && "opacity-50 cursor-not-allowed",
          displayError && "border-red-500/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) validateAndAdd(e.target.files);
            e.target.value = "";
          }}
        />

        <motion.div
          animate={dragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            dragging
              ? "bg-green-500/20 text-green-400"
              : "bg-white/[0.06] text-gray-500"
          )}
        >
          <Upload size={22} />
        </motion.div>

        <div className="text-center">
          <p className="text-sm text-gray-300 font-medium">{label}</p>
          <p className="text-xs text-gray-600 mt-1">
            {accept.split(",").map((e) => e.trim().replace(".", "").toUpperCase()).join(", ")} · Max {maxSize} MB
          </p>
        </div>
      </div>

      {displayError && (
        <p className="text-xs text-red-400 pl-0.5" role="alert">{displayError}</p>
      )}

      {/* File list / previews */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5"
            >
              {previews[i] ? (
                <img
                  src={previews[i]}
                  alt={file.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 bg-white/[0.04]"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <ImageIcon size={16} className="text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{file.name}</p>
                <p className="text-xs text-gray-600">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                aria-label={`Remove ${file.name}`}
                className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
