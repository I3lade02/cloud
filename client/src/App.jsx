import { useEffect, useMemo, useRef, useState } from "react";
import { apiBase, apiFetch, clearToken, getToken, setToken } from "./api";

/* =========================
   Theme (light/dark)
========================= */
const THEME_KEY = "picloud_theme";

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const root = document.documentElement; // <html>
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem(THEME_KEY, theme);
}

/* =========================
   Helpers
========================= */
function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function getExt(name = "") {
  const n = name.toLowerCase();
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i + 1) : "";
}

function isVideoFile(f) {
  if (typeof f?.isVideo === "boolean") return f.isVideo;
  return (f?.mime || "").startsWith("video/");
}

function isAudioFile(f) {
  const mime = (f?.mime || "").toLowerCase();
  const ext = getExt(f?.originalName || "");
  return (
    mime.startsWith("audio/") ||
    ["mp3", "wav", "flac", "aac", "m4a", "ogg", "opus"].includes(ext)
  );
}

function isImageFile(f) {
  const mime = (f?.mime || "").toLowerCase();
  const ext = getExt(f?.originalName || "");
  return (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "heic"].includes(ext)
  );
}

function fileIcon(f) {
  const mime = (f?.mime || "").toLowerCase();
  const ext = getExt(f?.originalName || "");

  if (
    isVideoFile(f) ||
    ["mp4", "mkv", "mov", "webm", "avi", "m4v"].includes(ext)
  )
    return "🎬";
  if (isAudioFile(f)) return "🎵";
  if (isImageFile(f)) return "🖼️";
  if (mime === "application/pdf" || ext === "pdf") return "📕";
  if (mime.startsWith("text/") || ["txt", "md", "log", "rtf"].includes(ext))
    return "📄";
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "json",
      "html",
      "css",
      "py",
      "java",
      "c",
      "cpp",
      "go",
      "rs",
      "php",
      "yml",
      "yaml",
      "sh",
      "bat",
      "ps1",
      "toml",
      "ini",
    ].includes(ext)
  )
    return "💻";
  if (["doc", "docx", "odt"].includes(ext)) return "🧾";
  if (["xls", "xlsx", "ods", "csv"].includes(ext)) return "📊";
  if (["ppt", "pptx", "odp"].includes(ext)) return "🖼️";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "📦";
  if (["exe", "msi", "deb", "rpm", "apk"].includes(ext)) return "🧩";

  return "🗂️";
}

function fileTypeLabel(f) {
  const mime = (f?.mime || "").toLowerCase();
  const ext = getExt(f?.originalName || "");
  if (isVideoFile(f)) return "Video";
  if (isAudioFile(f)) return "Audio";
  if (isImageFile(f)) return "Image";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("text/")) return "Text";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "Archive";
  return ext ? ext.toUpperCase() : "File";
}

/* =========================
   UI
========================= */
function Banner({ msg, onClose }) {
  if (!msg) return null;

  const cls =
    msg.type === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200";

  return (
    <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <div className="flex items-start justify-between gap-4">
        <div>{msg.text}</div>
        <button className="text-xs underline opacity-90" onClick={onClose}>
          close
        </button>
      </div>
    </div>
  );
}

function Login({ onLoggedIn, setMsg, busy, setBusy, theme, toggleTheme }) {
  const [password, setPassword] = useState("");

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Login failed");

      setToken(body.token);
      onLoggedIn();
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Login error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-6">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="text-2xl font-bold select-none hover:opacity-80 active:opacity-60"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              ☁️
            </button>
            <h1 className="text-2xl font-bold">PiCloud</h1>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            local-only
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Enter your local password
        </p>

        <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Tip: keep this service on your home network only.
        </p>
      </form>
    </div>
  );
}

function MediaModal({ file, onClose }) {
  if (!file) return null;

  const base = apiBase();
  const streamUrl = `${base}/api/files/${file.id}/stream`;
  const rawUrl = `${base}/api/files/${file.id}/raw`;

  const isVid = isVideoFile(file);
  const isAud = isAudioFile(file);
  const isImg = isImageFile(file);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="font-semibold truncate pr-3">{file.originalName}</div>
          <button className="text-sm underline opacity-90" onClick={onClose}>
            close
          </button>
        </div>

        <div className="p-4 bg-slate-950">
          {isVid && (
            <video
              className="w-full max-h-[75vh] rounded-xl bg-black"
              controls
              autoPlay
              playsInline
              src={streamUrl}
            />
          )}

          {isAud && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4">
              <audio controls autoPlay src={streamUrl} className="w-full" />
            </div>
          )}

          {isImg && (
            <div className="flex justify-center">
              <img
                src={rawUrl}
                alt={file.originalName}
                className="max-h-[75vh] rounded-xl"
              />
            </div>
          )}

          {!isVid && !isAud && !isImg && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 text-sm text-slate-700 dark:text-slate-200">
              No preview for this file type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileTile({
  file,
  base,
  busy,
  folders,
  onMove,
  onOpen,
  onDelete,
}) {
  const isVid = isVideoFile(file);
  const isAud = isAudioFile(file);
  const isImg = isImageFile(file);

  const thumbUrl = `${base}/api/files/${file.id}/thumb`;
  const rawUrl = `${base}/api/files/${file.id}/raw`;
  const downloadUrl = `${base}/api/files/${file.id}/download`;

  return (
    <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow transition overflow-hidden">
      {/* Preview */}
      <button
        type="button"
        onClick={() => onOpen(file)}
        className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950"
        title="Open"
      >
        {isVid ? (
          <>
            <img
              src={thumbUrl}
              alt="thumbnail"
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/50 px-3 py-2 text-white text-sm">
                ▶
              </div>
            </div>
          </>
        ) : isImg ? (
          <img
            src={rawUrl}
            alt={file.originalName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-700 dark:text-slate-200">
            <div className="text-4xl leading-none">{fileIcon(file)}</div>
            <div className="mt-2 text-xs font-semibold">{fileTypeLabel(file)}</div>
          </div>
        )}

        {isAud && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/50 px-3 py-2 text-white text-sm">
              ♪
            </div>
          </div>
        )}
      </button>

      {/* Body */}
      <div className="p-4">
        <div className="font-semibold truncate" title={file.originalName}>
          {file.originalName}
        </div>

        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
          <span>{formatBytes(file.size)}</span>
          {file.createdAt && <span>{formatDate(file.createdAt)}</span>}
        </div>

        <div className="mt-3 flex items-center gap-3">
          {(isVid || isAud || isImg) && (
            <button
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:underline disabled:opacity-60"
              onClick={() => onOpen(file)}
              disabled={busy}
              type="button"
            >
              {isVid ? "Play" : isAud ? "Play" : "View"}
            </button>
          )}

          <a
            className="text-sm font-semibold text-blue-600 hover:underline"
            href={downloadUrl}
          >
            Download
          </a>

          {/* Move UI */}
          <select
            value={file.folderId || ""}
            disabled={busy}
            onChange={(e) => onMove(file.id, e.target.value || null)}
            className="text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5"
            title="Move to folder"
          >
            <option value="">All files</option>
            {folders.map((fo) => (
              <option key={fo.id} value={fo.id}>
                {fo.name}
              </option>
            ))}
          </select>

          <button
            className="ml-auto text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
            onClick={() => onDelete(file.id, file.originalName)}
            disabled={busy}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   App
========================= */
export default function App() {
  const fileInputRef = useRef(null);

  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => applyTheme(theme), [theme]);
  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const [authed, setAuthed] = useState(!!getToken());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);

  const [stats, setStats] = useState(null);

  const [query, setQuery] = useState("");
  const [uploadPct, setUploadPct] = useState(null);

  const [sortBy, setSortBy] = useState("newest"); // newest|oldest|name|size
  const [filterBy, setFilterBy] = useState("all"); // all|videos|audio|images|docs

  const [openFile, setOpenFile] = useState(null);

  async function refreshFiles() {
    const res = await apiFetch("/api/files");
    if (res.status === 401) {
      clearToken();
      setAuthed(false);
      return;
    }
    if (!res.ok) throw new Error("Failed to load files");
    setFiles(await res.json());
  }

  async function refreshFolders() {
    const res = await apiFetch("/api/folders");
    if (res.status === 401) {
      clearToken();
      setAuthed(false);
      return;
    }
    if (!res.ok) throw new Error("Failed to load folders");
    setFolders(await res.json());
  }

  async function refreshStats() {
    const res = await apiFetch("/api/stats");
    if (res.status === 401) {
      clearToken();
      setAuthed(false);
      return;
    }
    if (!res.ok) throw new Error("Failed to load stats");
    setStats(await res.json());
  }

  useEffect(() => {
    if (!authed) return;
    Promise.all([refreshFiles(), refreshFolders(), refreshStats()]).catch((e) =>
      setMsg({ type: "err", text: e.message })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  function pickFiles() {
    fileInputRef.current?.click();
  }

  async function uploadFiles(filesToUpload) {
    const list = (filesToUpload || []).filter(Boolean);
    if (!list.length) return;

    setBusy(true);
    setMsg(null);
    setUploadPct(0);

    try {
      const token = getToken();
      const fd = new FormData();
      for (const f of list) fd.append("files", f);
      if (activeFolderId) fd.append("folderId", activeFolderId);

      const xhr = new XMLHttpRequest();
      const promise = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          setUploadPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => resolve(xhr);
        xhr.onerror = () => reject(new Error("Network error"));
      });

      const base = apiBase();
      xhr.open("POST", `${base}/api/files/upload`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(fd);

      await promise;

      if (xhr.status === 401) {
        clearToken();
        setAuthed(false);
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        let body = {};
        try {
          body = JSON.parse(xhr.responseText);
        } catch {}
        throw new Error(body.error || "Upload failed");
      }

      await Promise.all([refreshFiles(), refreshStats()]);
      setMsg({ type: "ok", text: `Uploaded ${list.length} file(s)!` });
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Upload error" });
    } finally {
      setBusy(false);
      setTimeout(() => setUploadPct(null), 800);
    }
  }

  async function onDelete(id, name) {
    const ok = confirm(`Delete "${name}"?`);
    if (!ok) return;

    setBusy(true);
    setMsg(null);

    try {
      const res = await apiFetch(`/api/files/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));

      if (res.status === 401) {
        clearToken();
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(body.error || "Delete failed");

      await Promise.all([refreshFiles(), refreshStats()]);
      setMsg({ type: "ok", text: "Deleted." });
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Delete error" });
    } finally {
      setBusy(false);
    }
  }

  async function createFolder() {
    const name = prompt("Folder name:");
    if (!name) return;

    setBusy(true);
    setMsg(null);

    try {
      const res = await apiFetch("/api/folders", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Create folder failed");

      await refreshFolders();
      setMsg({ type: "ok", text: "Folder created." });
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Folder error" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteFolder(folderId, name) {
    const ok = confirm(
      `Delete folder "${name}"? (Files will move to All files)`
    );
    if (!ok) return;

    setBusy(true);
    setMsg(null);

    try {
      const res = await apiFetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Delete folder failed");

      if (activeFolderId === folderId) setActiveFolderId(null);
      await Promise.all([refreshFolders(), refreshFiles()]);
      setMsg({ type: "ok", text: "Folder deleted." });
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Folder error" });
    } finally {
      setBusy(false);
    }
  }

  async function moveFile(fileId, folderId) {
    setBusy(true);
    setMsg(null);

    try {
      const res = await apiFetch(`/api/files/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({ folderId: folderId ?? null }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 401) {
        clearToken();
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(body.error || "Move failed");

      await refreshFiles();
      setMsg({ type: "ok", text: "Moved." });
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Move error" });
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    let list = [...files];

    if (activeFolderId) list = list.filter((f) => f.folderId === activeFolderId);

    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter((f) =>
        (f.originalName || "").toLowerCase().includes(q)
      );

    if (filterBy === "videos") list = list.filter((f) => isVideoFile(f));
    if (filterBy === "audio") list = list.filter((f) => isAudioFile(f));
    if (filterBy === "images") list = list.filter((f) => isImageFile(f));
    if (filterBy === "docs")
      list = list.filter(
        (f) => !isVideoFile(f) && !isAudioFile(f) && !isImageFile(f)
      );

    if (sortBy === "newest")
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest")
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "name")
      list.sort((a, b) =>
        (a.originalName || "").localeCompare(b.originalName || "")
      );
    if (sortBy === "size") list.sort((a, b) => (b.size || 0) - (a.size || 0));

    return list;
  }, [files, activeFolderId, query, filterBy, sortBy]);

  if (!authed) {
    return (
      <Login
        onLoggedIn={() => setAuthed(true)}
        setMsg={setMsg}
        busy={busy}
        setBusy={setBusy}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  const base = apiBase();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <MediaModal file={openFile} onClose={() => setOpenFile(null)} />

      <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="text-2xl font-bold select-none hover:opacity-80 active:opacity-60"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              ☁️
            </button>
            <h1 className="text-2xl font-bold">PiCloud</h1>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              local file box
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={pickFiles}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              Upload
            </button>

            <button
              onClick={() => {
                clearToken();
                setAuthed(false);
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Log out
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files || []);
              e.target.value = "";
              uploadFiles(picked);
            }}
            disabled={busy}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Banner msg={msg} onClose={() => setMsg(null)} />

        {/* Stats */}
        {stats && (
          <div className="mb-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-700 dark:text-slate-200">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <span className="font-semibold">{stats.fileCount}</span> files
              </div>
              <div>
                <span className="font-semibold">
                  {formatBytes(stats.totalBytes)}
                </span>{" "}
                used (PiCloud)
              </div>
              {stats.diskTotalBytes != null &&
                stats.diskFreeBytes != null && (
                  <div>
                    Disk:{" "}
                    <span className="font-semibold">
                      {formatBytes(stats.diskFreeBytes)}
                    </span>{" "}
                    free /{" "}
                    <span className="font-semibold">
                      {formatBytes(stats.diskTotalBytes)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar folders */}
          <aside className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Folders</div>
              <button
                onClick={createFolder}
                disabled={busy}
                className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-60"
                type="button"
              >
                + New
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveFolderId(null)}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm mb-1 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                activeFolderId === null
                  ? "bg-slate-100 dark:bg-slate-800 font-semibold"
                  : ""
              }`}
            >
              All files
            </button>

            <div className="mt-2 space-y-1">
              {folders.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFolderId(f.id)}
                    className={`flex-1 text-left rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      activeFolderId === f.id
                        ? "bg-slate-100 dark:bg-slate-800 font-semibold"
                        : ""
                    }`}
                    title={f.name}
                  >
                    {f.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFolder(f.id, f.name)}
                    className="text-xs text-red-600 hover:underline"
                    title="Delete folder"
                    disabled={busy}
                  >
                    del
                  </button>
                </div>
              ))}
              {folders.length === 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  No folders yet.
                </div>
              )}
            </div>
          </aside>

          {/* Content */}
          <section>
            {uploadPct !== null && (
              <div className="mb-5 rounded-xl bg-white dark:bg-slate-900 p-4 shadow border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Uploading…</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {uploadPct}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Drag & drop */}
            <div
              className="mb-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center shadow-sm"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (busy) return;
                const dropped = Array.from(e.dataTransfer.files || []);
                uploadFiles(dropped);
              }}
            >
              <div className="text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold">Drag & drop</span> files here,
                or{" "}
                <button
                  className="text-blue-600 font-semibold hover:underline disabled:opacity-60"
                  onClick={pickFiles}
                  disabled={busy}
                  type="button"
                >
                  browse
                </button>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Images preview • audio/video stream • folders • sorting/filtering
              </div>
            </div>

            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {filtered.length} item{filtered.length === 1 ? "" : "s"}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-56 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
                />

                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="videos">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="images">Images</option>
                  <option value="docs">Other</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>

                <button
                  onClick={() =>
                    Promise.all([refreshFiles(), refreshFolders(), refreshStats()])
                      .catch((e) => setMsg({ type: "err", text: e.message }))
                  }
                  disabled={busy}
                  className="text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                  type="button"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* GRID */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-10 text-center text-slate-500 dark:text-slate-400 shadow border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                  No files
                </div>
                <div className="mt-1 text-sm">Upload something to get started.</div>
              </div>
            ) : (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((f) => (
                  <FileTile
                    key={f.id}
                    file={f}
                    base={base}
                    busy={busy}
                    folders={folders}
                    onMove={moveFile}
                    onOpen={(file) => setOpenFile(file)}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
          PiCloud • local-only
        </footer>
      </main>
    </div>
  );
}
