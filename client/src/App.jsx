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
   File helpers
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

function isVideoFile(f) {
  if (typeof f?.isVideo === "boolean") return f.isVideo;
  return (f?.mime || "").startsWith("video/");
}

function getExt(name = "") {
  const n = name.toLowerCase();
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i + 1) : "";
}

function fileIcon(f) {
  const mime = (f?.mime || "").toLowerCase();
  const ext = getExt(f?.originalName || "");

  // Video handled by thumbnail, but keep a fallback
  if (
    mime.startsWith("video/") ||
    ["mp4", "mkv", "mov", "webm", "avi", "m4v"].includes(ext)
  )
    return "🎬";

  // Audio
  if (
    mime.startsWith("audio/") ||
    ["mp3", "wav", "flac", "aac", "m4a", "ogg", "opus"].includes(ext)
  )
    return "🎵";

  // Images
  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "heic"].includes(ext)
  )
    return "🖼️";

  // PDF
  if (mime === "application/pdf" || ext === "pdf") return "📕";

  // Text / notes
  if (mime.startsWith("text/") || ["txt", "md", "log", "rtf"].includes(ext))
    return "📄";

  // Code
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

  // Office docs
  if (["doc", "docx", "odt"].includes(ext)) return "🧾";
  if (["ppt", "pptx", "odp"].includes(ext)) return "🖼️";
  if (["xls", "xlsx", "ods", "csv"].includes(ext)) return "📊";

  // Archives
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "📦";

  // Executables / installers
  if (["exe", "msi", "deb", "rpm", "apk"].includes(ext)) return "🧩";

  return "🗂️";
}

function fileTypeLabel(f) {
  const mime = (f?.mime || "").toLowerCase();
  const ext = getExt(f?.originalName || "");

  if (mime.startsWith("audio/")) return "Audio";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("text/")) return "Text";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "Archive";
  if (["doc", "docx", "odt"].includes(ext)) return "Document";
  if (["xls", "xlsx", "ods", "csv"].includes(ext)) return "Spreadsheet";
  if (["ppt", "pptx", "odp"].includes(ext)) return "Presentation";

  return ext ? ext.toUpperCase() : "File";
}

/* =========================
   UI components
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
    <div className="min-h-screen min-w-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-6">
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

function VideoModal({ file, onClose }) {
  if (!file) return null;

  const base = apiBase();
  const streamUrl = `${base}/api/files/${file.id}/stream`;

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
          <video
            className="w-full max-h-[75vh] rounded-xl bg-black"
            controls
            autoPlay
            playsInline
            src={streamUrl}
          />
        </div>
      </div>
    </div>
  );
}

function FileTile({ file, base, busy, onPlay, onDelete }) {
  const isVid = isVideoFile(file);
  const thumbUrl = `${base}/api/files/${file.id}/thumb`;
  const downloadUrl = `${base}/api/files/${file.id}/download`;

  return (
    <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow transition overflow-hidden">
      {/* Preview */}
      <div className="relative aspect-video bg-slate-100 dark:bg-slate-950">
        {isVid ? (
          <>
            <img
              src={thumbUrl}
              alt="thumbnail"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/50 px-3 py-2 text-white text-sm">
                ▶
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-700 dark:text-slate-200">
            <div className="text-4xl leading-none">{fileIcon(file)}</div>
            <div className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {fileTypeLabel(file)}
            </div>
          </div>
        )}
      </div>

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
          {isVid && (
            <button
              className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:underline disabled:opacity-60"
              onClick={() => onPlay(file)}
              disabled={busy}
            >
              Play
            </button>
          )}

          <a
            className="text-sm font-semibold text-blue-600 hover:underline"
            href={downloadUrl}
          >
            Download
          </a>

          <button
            className="ml-auto text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
            onClick={() => onDelete(file.id, file.originalName)}
            disabled={busy}
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
  const [files, setFiles] = useState([]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [query, setQuery] = useState("");
  const [uploadPct, setUploadPct] = useState(null);

  const [playing, setPlaying] = useState(null);

  async function refresh() {
    const res = await apiFetch("/api/files");
    if (res.status === 401) {
      clearToken();
      setAuthed(false);
      return;
    }
    if (!res.ok) throw new Error("Failed to load files");
    setFiles(await res.json());
  }

  useEffect(() => {
    if (!authed) return;
    refresh().catch((e) => setMsg({ type: "err", text: e.message }));
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

      // Backend expects field name "files"
      for (const f of list) fd.append("files", f);

      const xhr = new XMLHttpRequest();
      const promise = new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          setUploadPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => resolve(xhr);
        xhr.onerror = () => reject(new Error("Network error"));
      });

      const base = apiBase(); // "" in prod, "http://localhost:3001" in dev
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

      await refresh();
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

      await refresh();
      setMsg({ type: "ok", text: "Deleted." });
    } catch (err) {
      setMsg({ type: "err", text: err.message || "Delete error" });
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) =>
      (f.originalName || "").toLowerCase().includes(q)
    );
  }, [files, query]);

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
    <div className="min-h-screen min-w-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <VideoModal file={playing} onClose={() => setPlaying(null)} />

      <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
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

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Banner msg={msg} onClose={() => setMsg(null)} />

        {uploadPct !== null && (
          <div className="mb-6 rounded-xl bg-white dark:bg-slate-900 p-4 shadow border border-slate-200 dark:border-slate-800">
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
          className="mb-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center shadow-sm"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (busy) return;
            const dropped = Array.from(e.dataTransfer.files || []);
            uploadFiles(dropped);
          }}
        >
          <div className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Drag & drop</span> files here, or{" "}
            <button
              className="text-white font-semibold hover:underline disabled:opacity-60"
              onClick={pickFiles}
              disabled={busy}
              type="button"
            >
              browse
            </button>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Multi-upload • grid view • videos play instantly
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {filtered.length} item{filtered.length === 1 ? "" : "s"}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-64 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400/30"
            />
            <button
              onClick={() =>
                refresh().catch((e) => setMsg({ type: "err", text: e.message }))
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
                onPlay={(file) => setPlaying(file)}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        <footer className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
          PiCloud • local-only
        </footer>
      </main>
    </div>
  );
}
