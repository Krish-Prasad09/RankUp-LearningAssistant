import { useRef, useState } from "react";
import { uploadDocument } from "../services/api";

export default function UploadModal({ onClose, onUploaded, folderPath = "/" }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validateAndSet = (f) => {
    setError("");
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("File size must be under 20MB.");
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.pdf$/i, ""));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = await uploadDocument(file, name, folderPath);
      onUploaded(data.document);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in text-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Upload Document</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-250 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            validateAndSet(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-950/20 scale-[1.02]"
              : "border-slate-800 hover:border-indigo-800/80 hover:bg-slate-950/40"
          }`}
        >
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <DocIcon className="w-7 h-7 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-200">
            {file ? file.name : isDragging ? "Drop your PDF here" : "Drag & drop or click to browse"}
          </p>
          <p className="text-xs text-slate-500 mt-1">PDF only · Max 20MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => validateAndSet(e.target.files[0])}
            className="hidden"
          />
        </div>

        {file && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Document name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-800 bg-slate-950 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-950/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-5 w-full py-3 btn-primary text-sm disabled:opacity-50 cursor-pointer"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}

function CloseIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
