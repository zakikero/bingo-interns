"use client";

import { useEffect, useMemo, useState } from "react";
import type { Submission, Activity, User } from "@/types";
import { useActivities, useUserSubmissions, useUsers } from "@/lib/hooks";
import { getUserSubmissions } from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const ADMIN_PASSWORD = "ilovefika123";
const ADMIN_STORAGE_KEY = "adminAccess";

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase();
}

function resolveImageExtension(url: string): string {
  const match = url.split("?")[0].match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i);
  return match ? match[1].toLowerCase() : "jpg";
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloadingUser, setIsDownloadingUser] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const { users, loading: usersLoading, error: usersError } = useUsers();
  const {
    submissions,
    loading: submissionsLoading,
    error: submissionsError,
  } = useUserSubmissions(selectedUserId);
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
  } = useActivities();

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored === "true") setHasAccess(true);
  }, []);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    setSelectedSubmissionId(null);
  }, [selectedUserId]);

  const activitiesById = useMemo(() => {
    return activities.reduce<Record<string, Activity>>((acc, activity) => {
      acc[activity.id] = activity;
      return acc;
    }, {});
  }, [activities]);

  const filteredSubmissions = useMemo(() => {
    const term = normalize(searchTerm);

    return submissions.filter((submission) => {
      const activity = activitiesById[submission.activity_id];
      const title = normalize(activity?.title);
      const response = normalize(submission.textResponse ?? "");

      return !term || title.includes(term) || response.includes(term);
    });
  }, [submissions, activitiesById, searchTerm]);

  const selectedSubmission = useMemo(() => {
    return (
      filteredSubmissions.find(
        (submission) => submission.id === selectedSubmissionId,
      ) ?? null
    );
  }, [filteredSubmissions, selectedSubmissionId]);

  const selectedUser = useMemo(() => {
    return users.find((user) => user.id === selectedUserId) ?? null;
  }, [users, selectedUserId]);

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem(ADMIN_STORAGE_KEY, "true");
      setHasAccess(true);
      setAuthError(null);
      setPassword("");
      return;
    }
    setAuthError("Incorrect password.");
  };

  const downloadZip = async (
    zipName: string,
    files: Array<{ name: string; url: string }>,
  ) => {
    if (files.length === 0) {
      throw new Error("No images available to download.");
    }

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    await Promise.all(
      files.map(async (file) => {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`Failed to download ${file.name}`);
        }
        const blob = await response.blob();
        zip.file(file.name, blob);
      }),
    );

    const blob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${zipName}.zip`;
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleDownloadUserImages = async () => {
    if (!selectedUser) return;
    setDownloadError(null);
    setIsDownloadingUser(true);

    try {
      const folderName = `${sanitizeName(selectedUser.username)}_images`;
      const files = submissions
        .filter((submission) => submission.imageUrl)
        .map((submission) => {
          const activity = activitiesById[submission.activity_id];
          const baseName = sanitizeName(
            activity?.title ?? submission.activity_id,
          );
          const extension = resolveImageExtension(submission.imageUrl ?? "");
          const fileName = `${folderName}/${baseName || submission.activity_id}.${extension}`;
          return { name: fileName, url: submission.imageUrl as string };
        });

      await downloadZip(folderName, files);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Failed to download images",
      );
    } finally {
      setIsDownloadingUser(false);
    }
  };

  const handleDownloadAllImages = async () => {
    setDownloadError(null);
    setIsDownloadingAll(true);

    try {
      const rootFolder = "bingo_user_image_submissions";
      const files: Array<{ name: string; url: string }> = [];

      await Promise.all(
        users.map(async (user) => {
          const userSubmissions = await getUserSubmissions(user.id);
          userSubmissions
            .filter((submission) => submission.imageUrl)
            .forEach((submission) => {
              const activity = activitiesById[submission.activity_id];
              const baseName = sanitizeName(
                activity?.title ?? submission.activity_id,
              );
              const extension = resolveImageExtension(
                submission.imageUrl ?? "",
              );
              const userFolder = `${rootFolder}/${sanitizeName(user.username)}`;
              files.push({
                name: `${userFolder}/${baseName || submission.activity_id}.${extension}`,
                url: submission.imageUrl as string,
              });
            });
        }),
      );

      await downloadZip(rootFolder, files);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Failed to download images",
      );
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (!hasAccess) {
    return (
      <section className="admin-card">
        <div className="admin-header">
          <p className="eyebrow">ADMIN</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">
            Enter the password to view user submissions.
          </p>
        </div>
        <form className="admin-auth" onSubmit={handlePasswordSubmit}>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
          {authError && <p className="form-error">{authError}</p>}
          <button className="btn btn-primary" type="submit">
            Unlock
          </button>
        </form>
      </section>
    );
  }

  if (usersLoading || activitiesLoading) {
    return <LoadingSpinner message="Loading admin data..." size="lg" />;
  }

  return (
    <section className="admin-card admin-card-wide">
      <div className="admin-header">
        <p className="eyebrow">ADMIN</p>
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">
          Review user activity submissions and search by text.
        </p>
        <div className="admin-header-actions">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleDownloadAllImages}
            disabled={isDownloadingAll || users.length === 0}
          >
            {isDownloadingAll
              ? "Preparing download…"
              : "Download all user images"}
          </button>
        </div>
      </div>

      {(usersError || activitiesError) && (
        <p className="form-error">
          {usersError || activitiesError || "Failed to load admin data."}
        </p>
      )}
      {downloadError && <p className="form-error">{downloadError}</p>}

      <div className="admin-grid">
        <div className="admin-panel admin-panel-activities">
          <h2>Users</h2>
          {users.length === 0 ? (
            <p className="admin-empty">No users found.</p>
          ) : (
            <ul className="admin-list">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className={`admin-list-item${
                      user.id === selectedUserId ? " active" : ""
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <span className="admin-list-title">{user.username}</span>
                    <span className="admin-list-meta">{user.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-row">
              <h2>Activities</h2>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleDownloadUserImages}
                disabled={
                  isDownloadingUser ||
                  !selectedUser ||
                  submissionsLoading ||
                  submissions.length === 0
                }
              >
                {isDownloadingUser
                  ? "Preparing download…"
                  : "Download user images"}
              </button>
            </div>
            <div className="admin-filters">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title or response"
                aria-label="Search submissions"
              />
            </div>
          </div>

          {submissionsError && <p className="form-error">{submissionsError}</p>}

          {submissionsLoading ? (
            <LoadingSpinner message="Loading submissions..." size="sm" />
          ) : filteredSubmissions.length === 0 ? (
            <p className="admin-empty">No submissions match your filters.</p>
          ) : (
            <ul className="admin-list admin-list-activities">
              {filteredSubmissions.map((submission) => {
                const activity = activitiesById[submission.activity_id];
                const createdAt = toDate(submission.created_at);
                const createdLabel = createdAt
                  ? createdAt.toLocaleString()
                  : "Unknown date";

                return (
                  <li
                    key={
                      submission.id ??
                      `${submission.user_id}-${submission.activity_id}`
                    }
                  >
                    <button
                      type="button"
                      className={`admin-list-item${
                        submission.id === selectedSubmissionId ? " active" : ""
                      }`}
                      onClick={() =>
                        setSelectedSubmissionId(submission.id ?? null)
                      }
                    >
                      <span className="admin-list-title">
                        {activity?.title ?? "Unknown activity"}
                      </span>
                      <span className="admin-list-meta">{createdLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="admin-panel">
          <h2>Details</h2>
          {!selectedUser && (
            <p className="admin-empty">Select a user to see details.</p>
          )}
          {selectedUser && !selectedSubmission && (
            <p className="admin-empty">
              Select an activity to see its submission.
            </p>
          )}
          {selectedSubmission && (
            <div className="admin-detail">
              <div>
                <h3>
                  {activitiesById[selectedSubmission.activity_id]?.title ??
                    "Activity"}
                </h3>
                <p className="admin-detail-meta">
                  User: {selectedUser?.username}
                </p>
                <p className="admin-detail-meta">
                  Submitted:{" "}
                  {toDate(selectedSubmission.created_at)?.toLocaleString() ??
                    "Unknown"}
                </p>
              </div>
              <div className="admin-detail-block">
                <h4>Image URL</h4>
                {selectedSubmission.imageUrl ? (
                  <div className="admin-image-preview">
                    <img
                      src={selectedSubmission.imageUrl}
                      alt="Uploaded submission"
                      loading="lazy"
                    />
                    <a
                      href={selectedSubmission.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedSubmission.imageUrl}
                    </a>
                  </div>
                ) : (
                  <p className="admin-empty">No image URL provided.</p>
                )}
              </div>
              <div className="admin-detail-block">
                <h4>Text Response</h4>
                {selectedSubmission.textResponse ? (
                  <p>{selectedSubmission.textResponse}</p>
                ) : (
                  <p className="admin-empty">No text response provided.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
