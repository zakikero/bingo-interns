"use client";

import { useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Activity } from "@/types";

interface ActivityModalProps {
  activity: Activity;
  onSubmit: (activityId: string, image: File | null) => Promise<void>;
  onClose: () => void;
}

export default function ActivityModal({ activity, onSubmit, onClose }: ActivityModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke the previous object URL to prevent memory leaks
  const pickFile = useCallback((file: File | null) => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setImage(file);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0] ?? null);
  };

  const handleRemoveImage = () => {
    pickFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Drag & drop handlers ----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      pickFile(file);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setLoading(true);
    try {
      await onSubmit(activity.id, image);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{activity.title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="modal-description">{activity.description}</p>

        <form onSubmit={handleSubmit}>
          {error && <p className="form-error">{error}</p>}

          {/* Image upload */}
          {activity.isImageRequired && (
            <div className="modal-field">
              <label htmlFor="activity-image">
                Upload image <span className="modal-required">*optional</span>
              </label>
              <div
                className={`modal-file-zone${dragging ? " drag-over" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {preview ? (
                  <div className="modal-preview-wrapper">
                    <img src={preview} alt="Preview" className="modal-preview-img" />
                    <button
                      type="button"
                      className="modal-preview-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="modal-file-placeholder">
                    <span className="modal-file-icon">📷</span>
                    <span>Click or drag an image here</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="activity-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          )}

          <button className="btn btn-primary modal-submit-btn" type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Complete Activity"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
