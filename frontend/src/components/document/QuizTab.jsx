import { useEffect, useState } from "react";
import { getQuiz, generateQuiz, submitQuizAttempt, exportQuizUrl } from "../../services/api";

export default function QuizTab({ doc, setDoc }) {
  const [quiz, setQuiz] = useState(doc.quiz || { questions: [], attempts: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [sourceMode, setSourceMode] = useState("document");
  const [total, setTotal] = useState(5);

  // In-progress attempt state
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null); // { score, total, results }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getQuiz(doc._id)
      .then((data) => {
        if (mounted) {
          setQuiz(data.quiz);
          setAnswers(new Array(data.quiz.questions.length).fill(-1));
        }
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [doc._id]);

  const startQuiz = (questions) => {
    setAnswers(new Array(questions.length).fill(-1));
    setCurrent(0);
    setResult(null);
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    try {
      const data = await generateQuiz(doc._id, { difficulty, sourceMode, total });
      setQuiz(data.quiz);
      setDoc((prev) => ({ ...prev, quiz: data.quiz }));
      startQuiz(data.quiz.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const data = await submitQuizAttempt(doc._id, answers);
      setResult(data);
      setQuiz((prev) => ({ ...prev, attempts: data.attempts }));
      setDoc((prev) => ({ ...prev, quiz: { ...prev.quiz, attempts: data.attempts } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    startQuiz(quiz.questions);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex items-center justify-center text-slate-100">
        <Spinner />
      </div>
    );
  }

  const hasQuiz = quiz.questions && quiz.questions.length > 0;

  // --- No quiz yet ---
  if (!hasQuiz) {
    return (
      <div className="text-slate-100">
        {error && (
          <div className="mb-4 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 flex items-center justify-center mx-auto mb-3">
            <QuizIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-200 mb-1">No quiz yet</p>
          <p className="text-xs text-slate-500 mb-5">Generate a multiple choice quiz from this document.</p>
          <QuizOptions
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            sourceMode={sourceMode}
            setSourceMode={setSourceMode}
            total={total}
            setTotal={setTotal}
            disabled={generating}
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {generating ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    );
  }

  // --- Results view ---
  if (result) {
    return (
      <div className="text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-5 text-center">
          <p className="text-xs font-semibold text-emerald-400 tracking-wide mb-2">QUIZ COMPLETE</p>
          <p className="text-4xl font-bold text-white mb-1">
            {result.score} / {result.total}
          </p>
          <p className="text-sm text-slate-500 mb-4">Attempt #{result.attemptNumber}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRetake}
              className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 transition-colors cursor-pointer"
            >
              Retake Quiz
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-sm font-medium border border-slate-800 hover:border-emerald-800 text-slate-300 hover:text-emerald-400 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 cursor-pointer bg-slate-950/20"
            >
              {generating ? "Generating..." : "Generate New Quiz"}
            </button>
            <a
              href={exportQuizUrl(doc._id)}
              className="flex items-center gap-2 text-sm font-medium border border-slate-800 hover:border-emerald-800 text-slate-300 hover:text-emerald-400 rounded-xl px-4 py-2 transition-colors cursor-pointer bg-slate-950/20"
            >
              <DownloadIcon className="w-4 h-4" />
              Export PDF
            </a>
          </div>
          <div className="mt-5">
            <QuizOptions
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              sourceMode={sourceMode}
              setSourceMode={setSourceMode}
              total={total}
              setTotal={setTotal}
              disabled={generating}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {result.results.map((r, i) => (
            <div key={i} className="bg-slate-900 border border-slate-850 rounded-2xl p-5">
              <p className="text-sm font-medium text-white mb-3">
                {i + 1}. {r.question}
              </p>
              <div className="flex flex-col gap-2">
                {r.options.map((opt, oi) => {
                  const isCorrect = oi === r.correctIndex;
                  const isSelected = oi === r.selected;
                  let cls = "border-slate-800 text-slate-350 bg-slate-950/10";
                  if (isCorrect) cls = "border-emerald-900 bg-emerald-950/30 text-emerald-405";
                  else if (isSelected && !isCorrect) cls = "border-red-900 bg-red-950/30 text-red-405";
                  return (
                    <div key={oi} className={`flex items-center justify-between border rounded-xl px-3 py-2 text-sm ${cls}`}>
                      <span>{opt}</span>
                      {isCorrect && <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      {isSelected && !isCorrect && <XIcon className="w-4 h-4 text-red-400 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
              {r.selected === -1 && (
                <p className="text-xs text-slate-500 mt-2">You skipped this question.</p>
              )}
            </div>
          ))}
        </div>

        {quiz.attempts.length > 0 && (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 mt-5">
            <p className="text-sm font-semibold text-slate-300 mb-3">Attempt History</p>
            <div className="flex flex-col gap-2">
              {quiz.attempts.map((a) => (
                <div key={a.attemptNumber} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Attempt #{a.attemptNumber}</span>
                  <span className="font-medium text-slate-200">
                    {a.score} / {a.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- In-progress quiz ---
  const q = quiz.questions[current];
  const allAnswered = answers.every((a) => a !== -1);
  const isLast = current === quiz.questions.length - 1;

  return (
    <div className="text-slate-100">
      {error && (
        <div className="mb-4 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <p className="text-sm font-medium text-slate-400">
          Question {current + 1} of {quiz.questions.length}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <QuizOptions
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            sourceMode={sourceMode}
            setSourceMode={setSourceMode}
            total={total}
            setTotal={setTotal}
            disabled={generating}
            compact
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-sm font-medium border border-slate-800 hover:border-emerald-850 text-slate-300 hover:text-emerald-405 rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50 cursor-pointer bg-slate-905"
          >
            {generating ? "Generating..." : "New Quiz"}
          </button>
          <a
            href={exportQuizUrl(doc._id)}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-emerald-405 border border-slate-800 hover:border-emerald-850 rounded-xl px-3 py-1.5 transition-colors cursor-pointer bg-slate-905"
          >
            <DownloadIcon className="w-4 h-4" />
            Export PDF
          </a>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        {quiz.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`flex-1 h-1.5 rounded-full transition-colors cursor-pointer ${
              i === current ? "bg-emerald-500" : answers[i] !== -1 ? "bg-emerald-800/60" : "bg-slate-800"
            }`}
          />
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <p className="text-base font-medium text-white mb-5">{q.question}</p>

        <div className="flex flex-col gap-2.5">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => selectAnswer(oi)}
              className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                answers[current] === oi
                  ? "border-emerald-700 bg-emerald-950/40 text-emerald-350"
                  : "border-slate-800 text-slate-300 hover:border-emerald-800/60 hover:bg-slate-950 bg-slate-950/20 cursor-pointer"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="text-sm font-medium text-slate-450 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={() => setCurrent((c) => Math.min(quiz.questions.length - 1, c + 1))}
              className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
            >
              Next
            </button>
          )}
        </div>

        {!allAnswered && isLast && (
          <p className="text-xs text-slate-500 mt-3 text-right">Answer all questions to submit.</p>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />;
}

function QuizOptions({ difficulty, setDifficulty, sourceMode, setSourceMode, total, setTotal, disabled, compact = false }) {
  const difficulties = ["easy", "medium", "hard"];
  const totals = [5, 10, 15, 20];
  const wrapperClass = compact
    ? "flex flex-col sm:flex-row sm:items-center gap-2"
    : "mx-auto flex max-w-2xl flex-col items-center gap-3";

  return (
    <div className={wrapperClass}>
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
        {difficulties.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setDifficulty(level)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
              difficulty === level
                ? "bg-slate-900 text-emerald-400 shadow-sm"
                : "text-slate-550 hover:text-slate-350"
            }`}
          >
            {level}
          </button>
        ))}
      </div>
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
        {totals.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => setTotal(count)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              total === count
                ? "bg-slate-900 text-emerald-400 shadow-sm"
                : "text-slate-550 hover:text-slate-350"
            }`}
          >
            {count}
          </button>
        ))}
      </div>
      <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
        <button
          type="button"
          onClick={() => setSourceMode("document")}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            sourceMode === "document"
              ? "bg-slate-900 text-emerald-400 shadow-sm"
              : "text-slate-550 hover:text-slate-350"
          }`}
        >
          PDF only
        </button>
        <button
          type="button"
          onClick={() => setSourceMode("document_internet")}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            sourceMode === "document_internet"
              ? "bg-slate-900 text-emerald-400 shadow-sm"
              : "text-slate-550 hover:text-slate-350"
          }`}
        >
          PDF + Internet
        </button>
      </div>
    </div>
  );
}

function QuizIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
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

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
