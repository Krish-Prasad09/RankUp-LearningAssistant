import { useEffect, useState } from "react";
import { getFlashcards, generateFlashcards, exportFlashcardsUrl } from "../../services/api";

const FLASHCARDS_MAX = 30;

export default function FlashcardsTab({ doc, setDoc }) {
  const [flashcards, setFlashcards] = useState(doc.flashcards || []);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    let mounted = true;
    getFlashcards(doc._id)
      .then((data) => {
        if (mounted) setFlashcards(data.flashcards);
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [doc._id]);

  const maxReached = flashcards.length >= FLASHCARDS_MAX;

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    try {
      const data = await generateFlashcards(doc._id);
      setFlashcards(data.flashcards);
      setDoc((prev) => ({ ...prev, flashcards: data.flashcards }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const goTo = (newIndex) => {
    setFlipped(false);
    setIndex(((newIndex % flashcards.length) + flashcards.length) % flashcards.length);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex items-center justify-center text-slate-100">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="text-slate-100">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-slate-400">
          {flashcards.length} / {FLASHCARDS_MAX} flashcards generated
        </p>
        <div className="flex items-center gap-2">
          {flashcards.length > 0 && (
            <a
              href={exportFlashcardsUrl(doc._id)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-800/85 bg-slate-905 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
            >
              <DownloadIcon className="w-4 h-4" />
              Export PDF
            </a>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || maxReached}
            className="flex items-center gap-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            {generating ? "Generating..." : maxReached ? "Max reached" : "Generate 5 more"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {flashcards.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 flex items-center justify-center mx-auto mb-3">
            <CardIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-200 mb-1">No flashcards yet</p>
          <p className="text-xs text-slate-500 mb-4">Generate flashcards from this document's content.</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {generating ? "Generating..." : "Generate Flashcards"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div
            onClick={() => setFlipped((f) => !f)}
            className="w-full max-w-xl h-64 cursor-pointer select-none"
            style={{ perspective: "1200px" }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div
                className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-xs font-semibold text-emerald-400 tracking-wide mb-3">QUESTION</span>
                <p className="text-base font-medium text-white">{flashcards[index].question}</p>
                <span className="text-xs text-slate-500 mt-4">Click to flip</span>
              </div>
              <div
                className="absolute inset-0 bg-emerald-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className="text-xs font-semibold text-emerald-100 tracking-wide mb-3">ANSWER</span>
                <p className="text-base font-medium text-white">{flashcards[index].answer}</p>
                <span className="text-xs text-emerald-100/70 mt-4">Click to flip back</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => goTo(index - 1)}
              className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-slate-300 min-w-[60px] text-center">
              {index + 1} / {flashcards.length}
            </span>
            <button
              onClick={() => goTo(index + 1)}
              className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />;
}

function PlusIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function DownloadIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 12l4.5-4.5M12 12V3" />
    </svg>
  );
}

function CardIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function ChevronLeft(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRight(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
