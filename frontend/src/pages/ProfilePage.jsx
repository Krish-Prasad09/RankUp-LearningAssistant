import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { getDashboard } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getDashboard()
      .then((data) => mounted && setStats(data))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="animate-fade-in text-slate-100">
      <TopBar title="Profile" subtitle="Your account and learning activity" />

      <div className="px-8 pb-10">
        {error && (
          <div className="mb-6 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            {user?.avatar && !imgError ? (
              <img
                src={user.avatar}
                alt={user.name}
                onError={() => setImgError(true)}
                className="w-20 h-20 rounded-2xl object-cover shadow border border-slate-800"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl hero-gradient text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-indigo-500/20">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div>
              <p className="text-xl font-bold text-white">{user?.name || "Learner"}</p>
              <p className="text-sm text-slate-500">{user?.email || "rankup@learn.app"}</p>
              <span className="inline-block mt-2 text-xs font-medium bg-indigo-950/30 text-indigo-450 border border-indigo-900/40 px-2.5 py-1 rounded-full">
                RankUp Student
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="self-start sm:self-center px-4 py-2 border border-red-950/50 hover:bg-red-950/30 text-red-400 text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          <StatCard label="Documents" value={loading ? "—" : stats?.totalDocuments ?? 0} gradient="from-blue-500 to-cyan-500" icon={<DocIcon className="w-5 h-5" />} />
          <StatCard label="Flashcards" value={loading ? "—" : stats?.totalFlashcards ?? 0} gradient="from-pink-500 to-rose-500" icon={<CardIcon className="w-5 h-5" />} />
          <StatCard label="Quiz Attempts" value={loading ? "—" : stats?.totalQuizzes ?? 0} gradient="from-emerald-500 to-teal-500" icon={<QuizIcon className="w-5 h-5" />} />
          <StatCard label="Learning Streak" value={loading ? "—" : `${stats?.learningStreak ?? 0} day${(stats?.learningStreak ?? 0) === 1 ? "" : "s"}`} gradient="from-amber-500 to-orange-500" icon={<StreakIcon className="w-5 h-5" />} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-white mb-3">About RankUp</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            RankUp is your smart learning assistant. Upload any PDF and instantly get an interactive chat,
            AI-generated summaries, flashcards, and quizzes — all grounded strictly in your document's content.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, gradient, icon }) {
  return (
    <div className="stat-card bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide mb-2">{label.toUpperCase()}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
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

function StreakIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a3.75 3.75 0 003.75-3.75c0-1.168-.482-2.223-1.258-2.981A6.75 6.75 0 0012 7.5a6.75 6.75 0 00-2.492 3.769 4.201 4.201 0 00-1.258 2.981A3.75 3.75 0 0012 18z" />
    </svg>
  );
}
