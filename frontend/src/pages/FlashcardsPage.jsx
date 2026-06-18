import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import { listDocuments, getFlashcards } from "../services/api";

export default function FlashcardsPage() {
  const [groups, setGroups] = useState([]); // [{ doc, flashcards }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Fetch all documents (paginate through everything)
        let all = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const data = await listDocuments(page, 50);
          all = all.concat(data.documents);
          hasMore = data.hasMore;
          page += 1;
        }

        const withCards = all.filter((d) => d.flashcardCount > 0);

        const results = await Promise.all(
          withCards.map(async (doc) => {
            try {
              const data = await getFlashcards(doc._id);
              return { doc, flashcards: data.flashcards };
            } catch {
              return { doc, flashcards: [] };
            }
          })
        );

        if (mounted) {
          setGroups(results);
          if (results.length > 0) setOpenId(results[0].doc._id);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totalCards = groups.reduce((sum, g) => sum + g.flashcards.length, 0);

  return (
    <div className="animate-fade-in text-slate-100">
      <TopBar title="Flashcards" subtitle={totalCards > 0 ? `${totalCards} flashcards across ${groups.length} document${groups.length === 1 ? "" : "s"}` : "All your flashcards in one place"} />

      <div className="px-8 pb-10">

        {error && (
          <div className="mb-6 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-slate-400">Loading...</p>}

        {!loading && groups.length === 0 && !error && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <CardIcon className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">No flashcards yet</p>
            <p className="text-xs text-slate-450 mb-5">
              Open a document and generate flashcards from its Flashcards tab.
            </p>
            <Link to="/documents" className="btn-primary inline-flex text-sm">
              Go to Documents
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {groups.map(({ doc, flashcards }) => {
            const isOpen = openId === doc._id;
            return (
              <div key={doc._id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenId(isOpen ? null : doc._id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center text-white flex-shrink-0">
                      <DocIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500">{flashcards.length} flashcards</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-slate-800/60 pt-4">
                    {flashcards.map((card, i) => (
                      <FlashcardPreview key={i} card={card} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FlashcardPreview({ card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped((f) => !f)} className="cursor-pointer select-none h-40" style={{ perspective: "1000px" }}>
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className="absolute inset-0 bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-center text-center overflow-y-auto"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-sm font-medium text-slate-100">{card.question}</p>
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 flex items-center justify-center text-center overflow-y-auto"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-sm font-medium text-white">{card.answer}</p>
        </div>
      </div>
    </div>
  );
}

function CardIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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

function ChevronDown(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
