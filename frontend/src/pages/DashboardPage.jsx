import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
import { getDashboard } from "../services/api";

const ACTIVITY_LABELS = {
  accessed_document: "Accessed Document",
  attempted_quiz: "Attempted Quiz",
  generated_flashcards: "Generated Flashcards",
  generated_summary: "Generated Summary",
};

const ACTIVITY_COLORS = {
  accessed_document: "bg-blue-500",
  attempted_quiz: "bg-emerald-500",
  generated_flashcards: "bg-pink-500",
  generated_summary: "bg-violet-500",
};

export default function DashboardPage() {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(location.state?.roomClosedMessage || "");

  useEffect(() => {
    if (location.state?.roomClosedMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    let mounted = true;
    getDashboard()
      .then((data) => mounted && setStats(data))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="animate-fade-in text-slate-100">
      <TopBar title="Dashboard" subtitle="Your learning at a glance" />

      <div className="px-8 pb-10">
        {notice && (
          <div className="mb-6 bg-amber-950/20 border border-amber-900/30 text-amber-300 text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <p className="font-medium">{notice}</p>
            </div>
            <button
              onClick={() => setNotice("")}
              className="text-amber-400 hover:text-amber-200 transition-colors font-semibold px-2 py-1 rounded-lg hover:bg-amber-950/40 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero */}
        <div className="hero-gradient rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
            <p className="text-indigo-100 text-sm max-w-lg mb-5">
              Upload PDFs, chat with your documents, generate summaries, flashcards, and quizzes — all powered by AI.
            </p>
            <Link
              to="/documents"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors border border-white/20"
            >
              <DocIcon className="w-4 h-4" />
              Go to Documents
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Documents"
            value={stats?.totalDocuments ?? "—"}
            gradient="from-blue-500 to-cyan-500"
            icon={<DocIcon className="w-5 h-5" />}
            loading={loading}
          />
          <StatCard
            label="Flashcards"
            value={stats?.totalFlashcards ?? "—"}
            gradient="from-pink-500 to-rose-500"
            icon={<CardIcon className="w-5 h-5" />}
            loading={loading}
          />
          <StatCard
            label="Quiz Attempts"
            value={stats?.totalQuizzes ?? "—"}
            gradient="from-emerald-500 to-teal-500"
            icon={<QuizIcon className="w-5 h-5" />}
            loading={loading}
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <ClockIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-white">Recent Activity</h2>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-800/60 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && (!stats?.recentActivity || stats.recentActivity.length === 0) && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-950/30 flex items-center justify-center mx-auto mb-3">
                <DocIcon className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">No activity yet</p>
              <p className="text-xs text-slate-500">Upload a document to get started</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {stats?.recentActivity?.map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between gap-4 border border-slate-800 rounded-xl px-4 py-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${ACTIVITY_COLORS[a.type] || "bg-slate-400"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {ACTIVITY_LABELS[a.type] || a.type}: {a.documentName}
                      {a.type === "attempted_quiz" && a.meta?.score != null && (
                        <span className="text-slate-400"> — {a.meta.score}/{a.meta.total}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <Link
                  to={`/documents/${a.documentId}`}
                  className="text-sm text-indigo-400 font-medium hover:text-indigo-300 flex-shrink-0"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, gradient, icon, loading }) {
  return (
    <div className="stat-card bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-450 tracking-wide mb-2">{label.toUpperCase()}</p>
          {loading ? (
            <div className="h-9 w-16 bg-slate-800/60 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white">{value}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DocIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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

function QuizIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
