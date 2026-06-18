import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDocument, renameDocument } from "../services/api";
import ContentTab from "../components/document/ContentTab";
import ChatTab from "../components/document/ChatTab";
import SummaryTab from "../components/document/SummaryTab";
import FlashcardsTab from "../components/document/FlashcardsTab";
import QuizTab from "../components/document/QuizTab";

const TABS = ["Content", "Chat", "Summary", "Flashcards", "Quizzes"];

export default function DocumentWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Content");
  const [renaming, setRenaming] = useState(false);
  const [nameValue, setNameValue] = useState("");

  useEffect(() => {
    let mounted = true;
    getDocument(id)
      .then((data) => {
        if (mounted) {
          setDoc(data.document);
          setNameValue(data.document.name);
        }
      })
      .catch((err) => mounted && setError(err.message));
    return () => {
      mounted = false;
    };
  }, [id]);

  const submitRename = async () => {
    const name = nameValue.trim();
    setRenaming(false);
    if (!name || !doc || name === doc.name) return;
    try {
      const data = await renameDocument(id, name);
      setDoc((prev) => ({ ...prev, name: data.document.name }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="px-8 py-6">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={() => navigate("/documents")} className="mt-3 text-sm text-emerald-600 hover:underline">
          ← Back to Documents
        </button>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="px-8 py-6">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 text-slate-100">
      <button
        onClick={() => navigate("/documents")}
        className="flex items-center gap-1.5 text-sm text-slate-450 hover:text-slate-250 mb-3 cursor-pointer"
      >
        <BackIcon className="w-4 h-4" />
        Back to Documents
      </button>

      {renaming ? (
        <input
          autoFocus
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={submitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") {
              setNameValue(doc.name);
              setRenaming(false);
            }
          }}
          className="text-2xl font-bold text-white bg-slate-950 border border-emerald-800 rounded-lg px-2 py-1 mb-4 outline-none"
        />
      ) : (
        <h1
          className="text-2xl font-bold text-white mb-4 cursor-pointer inline-flex items-center gap-2 group"
          onClick={() => setRenaming(true)}
          title="Click to rename"
        >
          {doc.name}
          <EditIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-350" />
        </h1>
      )}

      <div className="flex gap-6 border-b border-slate-800 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-450 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Content" && <ContentTab doc={doc} />}
      {activeTab === "Chat" && <ChatTab doc={doc} setDoc={setDoc} />}
      {activeTab === "Summary" && <SummaryTab doc={doc} setDoc={setDoc} />}
      {activeTab === "Flashcards" && <FlashcardsTab doc={doc} setDoc={setDoc} />}
      {activeTab === "Quizzes" && <QuizTab doc={doc} setDoc={setDoc} />}
    </div>
  );
}

function BackIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function EditIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}
