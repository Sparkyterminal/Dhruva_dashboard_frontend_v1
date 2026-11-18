import React, { useEffect, useRef, useState } from "react";
import { Camera, FileText, Paperclip, X } from "lucide-react";
import { toast } from "@/Components/AdminKit/toast";
import { uploadBill } from "./everydayApi";
import { openBill } from "./openBill";
import "./Everyday.css";

const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // photos are shrunk before upload, so a big original is fine

const sizeLabel = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const isAllowedType = (file, types) =>
  types.includes(file.type) || (/\.hei[cf]$/i.test(file.name) && types.includes("image/heic"));

/**
 * Bill upload: choose files, take a photo (phones), or drop them. Each file goes straight to S3
 * with its own progress bar. `bills` are the saved ones; the parent keeps them via onAdd/onRemove.
 */
const BillUploader = ({ bills, onAdd, onRemove, settings, authHeaders, disabled, error, onBusyChange }) => {
  const [uploads, setUploads] = useState([]); // { id, name, progress, error }
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const counter = useRef(0);

  const maxFiles = settings?.maxBillFiles ?? 5;
  const maxBytes = (settings?.maxBillSizeMB ?? 10) * 1024 * 1024;
  const types = settings?.billTypes ?? DEFAULT_TYPES;
  const uploading = uploads.filter((u) => !u.error).length;

  useEffect(() => {
    onBusyChange?.(uploading > 0);
  }, [uploading, onBusyChange]);

  const patch = (id, change) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u)));

  const start = async (file) => {
    const id = (counter.current += 1);
    setUploads((list) => [...list, { id, name: file.name, progress: 0, error: null }]);
    try {
      const bill = await uploadBill({
        file,
        authHeaders,
        onProgress: (progress) => patch(id, { progress }),
      });
      onAdd(bill);
      setUploads((list) => list.filter((u) => u.id !== id));
    } catch (err) {
      patch(id, { error: err?.response?.data?.message || "Upload failed. Remove it and try again." });
    }
  };

  const accept = (fileList) => {
    let room = maxFiles - bills.length - uploads.length;
    Array.from(fileList).forEach((file) => {
      const isPdf = file.type === "application/pdf";
      if (room <= 0) return toast.error(`You can attach up to ${maxFiles} files`);
      if (!isAllowedType(file, types)) return toast.error(`${file.name}: use a photo (JPG, PNG, HEIC) or a PDF`);
      if (file.size > (isPdf ? maxBytes : MAX_IMAGE_BYTES)) {
        return toast.error(`${file.name} is too big (limit ${isPdf ? settings?.maxBillSizeMB ?? 10 : 25} MB)`);
      }
      room -= 1;
      start(file);
    });
  };

  const pick = (e) => {
    accept(e.target.files || []);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) accept(e.dataTransfer.files || []);
  };

  return (
    <div className={`ee-bills${error ? " has-error" : ""}`}>
      <div
        className={`ee-drop${dragging ? " is-over" : ""}${disabled ? " is-disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p>Drop bills here, or</p>
        <div className="ee-drop-actions">
          <button type="button" className="fk-btn" disabled={disabled} onClick={() => cameraRef.current?.click()}>
            <Camera size={15} aria-hidden="true" /> Take photo
          </button>
          <button type="button" className="fk-btn" disabled={disabled} onClick={() => fileRef.current?.click()}>
            <Paperclip size={15} aria-hidden="true" /> Choose file
          </button>
        </div>
        <span className="ee-drop-hint">
          JPG, PNG, HEIC or PDF · up to {maxFiles} files · {bills.length + uploads.length}/{maxFiles} added
        </span>
        <input ref={fileRef} type="file" accept={types.join(",")} multiple hidden onChange={pick} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      </div>

      {bills.length > 0 || uploads.length > 0 ? (
        <ul className="ee-bill-list">
          {bills.map((b) => (
            <li key={b.key}>
              <FileText size={16} aria-hidden="true" />
              <button
                type="button"
                className="ee-bill-name"
                onClick={() => openBill({ key: b.key, authHeaders })}
                title="Open this bill"
              >
                {b.name}
              </button>
              <span>{sizeLabel(b.size)}</span>
              {!disabled ? (
                <button type="button" className="ee-icon-btn" aria-label={`Remove ${b.name}`} onClick={() => onRemove(b.key)}>
                  <X size={15} aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
          {uploads.map((u) => (
            <li key={u.id} className={u.error ? "is-failed" : ""}>
              <FileText size={16} aria-hidden="true" />
              <span className="ee-bill-name is-plain">{u.name}</span>
              {u.error ? (
                <>
                  <span className="ee-bill-error">{u.error}</span>
                  <button
                    type="button"
                    className="ee-icon-btn"
                    aria-label={`Remove ${u.name}`}
                    onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <span className="ee-bill-progress" role="progressbar" aria-valuenow={u.progress} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${u.progress}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="fk-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default BillUploader;
