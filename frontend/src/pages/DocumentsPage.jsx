import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import UploadModal from "../components/UploadModal";
import { listDocuments, listFolders, createFolder, deleteDocument, deleteFolder } from "../services/api";

const FOLDER_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-violet-500 to-indigo-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
];

export default function DocumentsPage() {
  const [view, setView] = useState("root");
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingPath, setDeletingPath] = useState(null);
  const navigate = useNavigate();
  const sentinelRef = useRef(null);

  const loadDocuments = useCallback(async (pageToLoad, path) => {
    setLoading(true);
    setError("");
    try {
      const data = await listDocuments(pageToLoad, 10, path);
      setDocuments((prev) =>
        pageToLoad === 1 ? data.documents : [...prev, ...data.documents]
      );
      setHasMore(data.hasMore);
      setPage(pageToLoad);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFolders = useCallback(async (path) => {
    try {
      const data = await listFolders(path);
      setFolders(data.folders || []);
    } catch (err) {
      console.error("Error loading folders:", err);
    }
  }, []);

  useEffect(() => {
    loadDocuments(1, currentPath);
    loadFolders(currentPath);
  }, [currentPath, loadDocuments, loadFolders]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadDocuments(page + 1, currentPath);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, loadDocuments, currentPath]);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    const path = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
    try {
      await createFolder(path);
      setNewFolderName("");
      loadFolders(currentPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleEnterFolder = (folderPath) => {
    setCurrentPath(folderPath);
    if (currentPath === "/") setView("folder");
    setPage(1);
    setDocuments([]);
  };

  const handleUploaded = () => {
    setShowUpload(false);
    loadDocuments(1, currentPath);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document and all its data?")) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteFolder = async (path) => {
    if (!confirm("Delete this folder and ALL documents inside? This cannot be undone!")) return;
    setDeletingPath(path);
    try {
      await deleteFolder(path);
      setFolders((prev) => prev.filter((f) => f.path !== path));
      loadFolders(currentPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingPath(null);
    }
  };

  const handleGoBack = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const newPath = parts.length ? `/${parts.join("/")}` : "/";
    setCurrentPath(newPath);
    setView(newPath === "/" ? "root" : "folder");
  };

  const getFolderGradient = (index) => FOLDER_GRADIENTS[index % FOLDER_GRADIENTS.length];
  const breadcrumb = currentPath.split("/").filter(Boolean);
  const isRoot = view === "root";

  return (
    <div className="animate-fade-in text-slate-100">
      <TopBar
        title={isRoot ? "Documents" : breadcrumb[breadcrumb.length - 1]}
        subtitle={isRoot ? "Organize your learning materials in folders" : currentPath}
      />

      <div className="px-8 pb-10">
        {!isRoot && (
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 text-sm text-slate-450 hover:text-indigo-400 mb-5 transition-colors cursor-pointer"
          >
            <BackIcon className="w-4 h-4" />
            Back to {breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : "All Folders"}
          </button>
        )}

        {/* Create Folder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-sm">
          <label className="text-slate-200 font-semibold mb-3 block">
            {isRoot ? "Create New Subject / Folder" : "Create Subfolder"}
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={isRoot ? "e.g., Mathematics, Physics, Data Science..." : "e.g., Books, Tutorials, PYQs..."}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingFolder ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* Folders Grid */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">
              {isRoot ? "Your Folders" : "Subfolders"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {folders.map((folder, idx) => (
                <FolderCard
                  key={folder.path}
                  folder={folder}
                  gradient={getFolderGradient(idx)}
                  isRoot={isRoot}
                  deleting={deletingPath === folder.path}
                  onOpen={() => handleEnterFolder(folder.path)}
                  onDelete={() => handleDeleteFolder(folder.path)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">
              {isRoot ? "Documents at Root" : "Documents"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  doc={doc}
                  onOpen={() => navigate(`/documents/${doc._id}`)}
                  onDelete={() => handleDelete(doc._id)}
                />
              ))}
            </div>
            <div ref={sentinelRef} className="h-10" />
          </div>
        )}

        {/* Empty state */}
        {documents.length === 0 && folders.length === 0 && !loading && (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="text-5xl mb-4 animate-float">📁</div>
            <p className="text-slate-300 font-medium mb-2">No folders or documents yet</p>
            <p className="text-slate-500 text-sm mb-6">Create a folder or upload a PDF to get started</p>
            <button onClick={() => setShowUpload(true)} className="btn-primary">
              Upload PDF
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
            <Spinner className="w-5 h-5" />
            Loading...
          </div>
        )}

        {/* Upload FAB */}
        {(folders.length > 0 || documents.length > 0) && (
          <button
            onClick={() => setShowUpload(true)}
            className="fixed bottom-8 right-8 btn-primary flex items-center gap-2 shadow-xl shadow-indigo-500/30 z-20"
          >
            <UploadIcon className="w-5 h-5" />
            Upload PDF
          </button>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 max-w-sm">
          <span className="flex-shrink-0">⚠</span>
          <span className="text-sm">{error}</span>
          <button onClick={() => setError("")} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
          folderPath={currentPath}
        />
      )}
    </div>
  );
}

function FolderCard({ folder, gradient, isRoot, deleting, onOpen, onDelete }) {
  if (isRoot) {
    return (
      <div className={`folder-card relative h-36 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg overflow-hidden group`}>
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => e.key === "Enter" && onOpen()}
          className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <FolderIcon className="w-10 h-10 text-white/80" />
          <div className="text-white font-bold text-center px-4 truncate w-full">{folder.name}</div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={deleting}
          className="absolute top-2.5 right-2.5 z-10 bg-red-500/90 hover:bg-red-600 text-white rounded-lg w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md disabled:opacity-50"
          title="Delete folder"
        >
          {deleting ? <Spinner className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="folder-card relative bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-sm hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/5 group">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-950/40 flex items-center justify-center mb-3">
          <FolderIcon className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="font-semibold text-slate-200 truncate">{folder.name}</div>
        <div className="text-xs text-slate-500 mt-1">Click to open</div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        disabled={deleting}
        className="absolute top-3 right-3 z-10 bg-red-950/30 hover:bg-red-900/40 text-red-450 rounded-lg w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 cursor-pointer"
        title="Delete folder"
      >
        {deleting ? <Spinner className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}
      </button>
    </div>
  );
}

function DocumentCard({ doc, onOpen, onDelete }) {
  return (
    <div className="group bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-sm hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => e.key === "Enter" && onOpen()}
          className="w-12 h-12 rounded-xl bg-blue-950/40 flex items-center justify-center cursor-pointer"
        >
          <DocIcon className="w-6 h-6 text-blue-400" />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg p-1.5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Delete document"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="cursor-pointer"
      >
        <div className="font-semibold text-slate-200 truncate">{doc.name}</div>
        <div className="text-xs text-slate-500 mt-1">
          {doc.flashcardCount > 0 && `${doc.flashcardCount} cards · `}
          {new Date(doc.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function FolderIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

function DocIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function UploadIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function BackIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function Spinner(props) {
  return (
    <svg {...props} className={`animate-spin ${props.className || ""}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
