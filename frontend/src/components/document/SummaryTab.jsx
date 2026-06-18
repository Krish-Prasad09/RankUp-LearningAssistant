import { useEffect, useState } from "react";
import { getSummary } from "../../services/api";

export default function SummaryTab({ doc, setDoc }) {
  const [summary, setSummary] = useState(doc.summary?.generated ? doc.summary : null);
  const [loading, setLoading] = useState(!doc.summary?.generated);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("quick");

  useEffect(() => {
    if (doc.summary?.generated) {
      setSummary(doc.summary);
      setLoading(false);
      return;
    }
    load(false);
  }, [doc._id]);

  const load = async (regenerate) => {
    setError("");
    if (regenerate) setRegenerating(true);
    else setLoading(true);
    try {
      const data = await getSummary(doc._id, regenerate);
      setSummary(data.summary);
      setDoc((prev) => ({ ...prev, summary: data.summary }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center text-slate-100">
        <Spinner />
        <p className="text-sm text-slate-400 mt-3">Generating summary from document...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-100">
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button
          onClick={() => load(false)}
          className="text-sm text-emerald-400 font-medium hover:text-emerald-300 cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="inline-flex bg-slate-950 rounded-xl p-1">
          <button
            onClick={() => setView("quick")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              view === "quick" ? "bg-slate-900 text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-350"
            }`}
          >
            Quick Overview
          </button>
          <button
            onClick={() => setView("detailed")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              view === "detailed" ? "bg-slate-900 text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-350"
            }`}
          >
            Detailed Summary
          </button>
        </div>

        <button
          onClick={() => load(true)}
          disabled={regenerating}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-800/80 rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50 cursor-pointer bg-slate-950/20"
        >
          <RefreshIcon className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="prose prose-sm max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap">
        {view === "quick" ? summary?.quick : summary?.detailed}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
  );
}

function RefreshIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
