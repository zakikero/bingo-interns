"use client";

import { useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Activity } from "@/types";

interface ActivityModalProps {
  activity: Activity;
  onSubmit: (
    activityId: string,
    image: File | null,
    textResponse: string | null,
  ) => Promise<void>;
  onClose: () => void;
}

const MAX_TEXT_LENGTH = 150;

export default function ActivityModal({
  activity,
  onSubmit,
  onClose,
}: ActivityModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isImageRequired = activity.isImageRequired;
  const isTextRequired = activity.isTextRequired;

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
    if (isImageRequired && !image) {
      setError("Please upload an image to complete this activity.");
      return;
    }
    const trimmedText = textResponse.trim();
    if (isTextRequired && !trimmedText) {
      setError("Please enter a text response to complete this activity.");
      return;
    }
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      setError(`Text response must be ${MAX_TEXT_LENGTH} characters or fewer.`);
      return;
    }
    setLoading(true);
    try {
      await onSubmit(activity.id, image, trimmedText || null);
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
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="modal-description">{activity.description}</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" aria-live="polite">
              {error}
            </p>
          )}

          {/* Image upload */}
          <div className="modal-field">
            <label htmlFor="activity-image">
              Upload image{" "}
              {isImageRequired ? (
                <span className="modal-required">*required</span>
              ) : (
                <span className="modal-optional">optional</span>
              )}
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
                  <img
                    src={preview}
                    alt="Preview"
                    className="modal-preview-img"
                  />
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

          {isTextRequired && (
            <div className="modal-field">
              <label htmlFor="activity-text">
                Response <span className="modal-required">*required</span>
              </label>
              <textarea
                id="activity-text"
                className="modal-textarea"
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                maxLength={MAX_TEXT_LENGTH}
                rows={4}
                placeholder="Type your response here"
              />
              <div className="modal-hint">
                {textResponse.length}/{MAX_TEXT_LENGTH} characters
              </div>
            </div>
          )}

          <button
            className="btn btn-primary modal-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting…" : "Complete Activity"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
