import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import {
  createQuizRoom,
  generateQuizFromFolders,
  joinQuizRoom,
  listFolders,
  analyzeQuiz,
  listDocuments,
} from "../services/api";
import {
  finishQuizSocketRoom,
  getQuizSocket,
  joinQuizSocketRoom,
  startQuizSocketRoom,
  submitQuizSocketAnswers,
} from "../services/quizSocket";

export default function QuizzesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [difficulty, setDifficulty] = useState("medium");
  const [sourceMode, setSourceMode] = useState("document");
  const [total, setTotal] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(null);
  const [roomError, setRoomError] = useState(location.state?.roomClosedMessage || "");
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomAnswers, setRoomAnswers] = useState([]);
  const [roomCurrent, setRoomCurrent] = useState(0);
  const [concealGeneratedQuiz, setConcealGeneratedQuiz] = useState(false);
  const [roomDuration, setRoomDuration] = useState(120);
  const [socketConnected, setSocketConnected] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // Single Player Quiz States
  const [singlePlayerActive, setSinglePlayerActive] = useState(false);
  const [singlePlayerCurrent, setSinglePlayerCurrent] = useState(0);
  const [singlePlayerAnswers, setSinglePlayerAnswers] = useState([]);
  const [singlePlayerResult, setSinglePlayerResult] = useState(null);

  // Multi-Document Selector States
  const [allDocs, setAllDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());

  const toggleDoc = (id) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const syncRoomAnswers = (nextRoom) => {
    setRoomAnswers((prev) => {
      if (nextRoom.myAnswers?.length === nextRoom.questions.length) return nextRoom.myAnswers;
      if (prev.length === nextRoom.questions.length) return prev;
      return new Array(nextRoom.questions.length).fill(-1);
    });
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([listFolders("/"), listDocuments(1, 100, "/", true)])
      .then(([fData, dData]) => {
        if (mounted) {
          setFolders(fData.folders || []);
          setAllDocs(dData.documents || []);
        }
      })
      .catch(() => {
        if (mounted) {
          setFolders([]);
          setAllDocs([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!room?.code) return undefined;

    const socket = getQuizSocket();
    setSocketConnected(socket.connected);

    const handleRoomUpdate = ({ room: nextRoom }) => {
      setRoom(nextRoom);
      syncRoomAnswers(nextRoom);
      if (nextRoom.status === "finished") setConcealGeneratedQuiz(false);
    };
    const handleSocketError = (err) => setRoomError(err.message || "Multiplayer connection failed.");
    const handleRoomClosed = ({ reason } = {}) => {
      const message = reason || "The multiplayer room has been closed.";
      setRoom(null);
      setRoomAnswers([]);
      setConcealGeneratedQuiz(false);
      navigate("/", { replace: true, state: { roomClosedMessage: message } });
    };
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("quiz:room", handleRoomUpdate);
    socket.on("quiz:closed", handleRoomClosed);
    socket.on("connect_error", handleSocketError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    joinQuizSocketRoom(room.code)
      .then(({ room: nextRoom }) => handleRoomUpdate({ room: nextRoom }))
      .catch((err) => setRoomError(err.message));

    return () => {
      socket.off("quiz:room", handleRoomUpdate);
      socket.off("quiz:closed", handleRoomClosed);
      socket.off("connect_error", handleSocketError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [room?.code, navigate]);

  const toggle = (path) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedDocIds.size === 0) return setError("Select at least one document to generate a quiz from.");
    setError("");
    setLoading(true);
    try {
      const resp = await generateQuizFromFolders([], { documentIds: Array.from(selectedDocIds), difficulty, sourceMode, total });
      setQuiz(resp.quiz);
      setRoom(null);
      setConcealGeneratedQuiz(false);
      setAiReport("");

      // Reset single player state
      setSinglePlayerActive(false);
      setSinglePlayerResult(null);
      setSinglePlayerAnswers(new Array(resp.quiz.questions.length).fill(-1));
      setSinglePlayerCurrent(0);
    } catch (err) {
      setError(err.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!quiz?.questions?.length) return;
    setRoomError("");
    setRoomLoading(true);
    try {
      const data = await createQuizRoom({
        title: "RankUp Multiplayer Quiz",
        questions: quiz.questions,
        duration: roomDuration,
      });
      setRoom(data.room);
      setConcealGeneratedQuiz(true);
      syncRoomAnswers(data.room);
      setRoomCurrent(0);
      setAiReport("");
    } catch (err) {
      setRoomError(err.message);
    } finally {
      setRoomLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    setRoomError("");
    setRoomLoading(true);
    try {
      const data = await joinQuizRoom(roomCode);
      setRoom(data.room);
      syncRoomAnswers(data.room);
      setRoomCurrent(0);
      setAiReport("");
    } catch (err) {
      setRoomError(err.message);
    } finally {
      setRoomLoading(false);
    }
  };

  const handleStartRoom = async () => {
    setRoomLoading(true);
    try {
      const data = await startQuizSocketRoom(room.code);
      setRoom(data.room);
    } catch (err) {
      setRoomError(err.message);
    } finally {
      setRoomLoading(false);
    }
  };

  const handleFinishRoom = async () => {
    setRoomLoading(true);
    try {
      const data = await finishQuizSocketRoom(room.code, roomAnswers);
      setRoom(data.room);
      setConcealGeneratedQuiz(false);
    } catch (err) {
      setRoomError(err.message);
    } finally {
      setRoomLoading(false);
    }
  };

  const handleSubmitRoom = async () => {
    setRoomLoading(true);
    try {
      const data = await submitQuizSocketAnswers(room.code, roomAnswers);
      setRoom(data.room);
    } catch (err) {
      setRoomError(err.message);
    } finally {
      setRoomLoading(false);
    }
  };

  // Single Player Actions
  const handleStartSinglePlayer = () => {
    setSinglePlayerAnswers(new Array(quiz.questions.length).fill(-1));
    setSinglePlayerCurrent(0);
    setSinglePlayerResult(null);
    setSinglePlayerActive(true);
    setAiReport("");
  };

  const handleGenerateSinglePlayerReport = async () => {
    if (!quiz || !singlePlayerResult) return;
    setReportLoading(true);
    setAiReport("");
    try {
      const data = await analyzeQuiz(quiz.questions, singlePlayerAnswers);
      setAiReport(data.report);
    } catch (err) {
      setError(err.message || "Failed to generate AI report.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateMultiplayerReport = async () => {
    if (!room || !roomAnswers.length) return;
    setReportLoading(true);
    setAiReport("");
    try {
      const data = await analyzeQuiz(room.questions, roomAnswers);
      setAiReport(data.report);
    } catch (err) {
      setRoomError(err.message || "Failed to generate AI report.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleSinglePlayerSelectAnswer = (optionIndex) => {
    setSinglePlayerAnswers((prev) => {
      const next = [...prev];
      next[singlePlayerCurrent] = optionIndex;
      return next;
    });
  };

  const handleSinglePlayerSubmit = () => {
    let score = 0;
    const results = quiz.questions.map((q, i) => {
      const selected = singlePlayerAnswers[i];
      const correct = selected === q.correctIndex;
      if (correct) score++;
      return {
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        selected,
        correct,
      };
    });
    setSinglePlayerResult({
      score,
      total: quiz.questions.length,
      results,
    });
    setSinglePlayerActive(false);
  };

  return (
    <div className="animate-fade-in text-slate-100">
      <TopBar title="Quizzes" subtitle="Generate quizzes from your document folders" />

      <div className="px-8 pb-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-350 mb-4">Select documents from any folder to generate a quiz</p>
          <div className="space-y-3">
            {/* Render Root documents if any */}
            {allDocs.some((d) => !d.folderPath || d.folderPath === "/") && (
              <FolderAccordion
                title="General Documents"
                documents={allDocs.filter((d) => !d.folderPath || d.folderPath === "/")}
                selectedDocIds={selectedDocIds}
                toggleDoc={toggleDoc}
              />
            )}

            {/* Render subfolders */}
            {folders.map((folder) => {
              const folderDocs = allDocs.filter((d) => d.folderPath === folder.path);
              if (folderDocs.length === 0) return null; // hide empty folders for quiz
              return (
                <FolderAccordion
                  key={folder.path}
                  title={folder.name}
                  documents={folderDocs}
                  selectedDocIds={selectedDocIds}
                  toggleDoc={toggleDoc}
                />
              );
            })}

            {allDocs.length === 0 && (
              <div className="text-sm text-slate-500 py-2">
                No documents found. Upload documents first in the Documents tab.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="border border-slate-800 px-4 py-2.5 rounded-xl text-sm bg-slate-950 text-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={sourceMode}
              onChange={(e) => setSourceMode(e.target.value)}
              className="border border-slate-800 px-4 py-2.5 rounded-xl text-sm bg-slate-950 text-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none"
            >
              <option value="document">PDF only</option>
              <option value="document_internet">PDF + Internet</option>
            </select>
            <select
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              className="border border-slate-800 px-4 py-2.5 rounded-xl text-sm bg-slate-950 text-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none"
            >
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
              <option value={20}>20 questions</option>
            </select>
            <button onClick={handleGenerate} disabled={loading} className="btn-primary text-sm">
              {loading ? "Generating..." : "Generate Quiz"}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{error}</div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-300">Multiplayer Room</p>
              <p className="text-sm text-slate-500">Create a room from a generated quiz or join one with a code.</p>
            </div>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Room code"
                className="border border-slate-800 bg-slate-950 rounded-xl px-4 py-2.5 text-sm text-white uppercase tracking-wider outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button className="btn-primary text-sm" disabled={roomLoading || !roomCode.trim()}>
                Join
              </button>
            </form>
          </div>
          {roomError && <div className="mt-4 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{roomError}</div>}
          {room && (
            <RoomPanel
              room={room}
              loading={roomLoading}
              answers={roomAnswers}
              setAnswers={setRoomAnswers}
              current={roomCurrent}
              setCurrent={setRoomCurrent}
              onStart={handleStartRoom}
              onFinish={handleFinishRoom}
              onSubmit={handleSubmitRoom}
              socketConnected={socketConnected}
              aiReport={aiReport}
              reportLoading={reportLoading}
              onGenerateReport={handleGenerateMultiplayerReport}
              onDismissReport={() => setAiReport("")}
            />
          )}
        </div>

        {quiz && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            {/* 1. Results View */}
            {singlePlayerResult && (
              <div>
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 mb-5 text-center">
                  <p className="text-xs font-semibold text-indigo-400 tracking-wide mb-2">QUIZ COMPLETE (SINGLE PLAYER)</p>
                  <p className="text-4xl font-bold text-white mb-1">
                    {singlePlayerResult.score} / {singlePlayerResult.total}
                  </p>
                  <p className="text-xs text-slate-550 mb-4">
                    {Math.round((singlePlayerResult.score / singlePlayerResult.total) * 100)}% Correct
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleStartSinglePlayer}
                      className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 transition-colors cursor-pointer"
                    >
                      Retake Quiz
                    </button>
                    <button
                      onClick={handleGenerateSinglePlayerReport}
                      disabled={reportLoading}
                      className="text-sm font-medium border border-indigo-900 hover:border-indigo-850 text-indigo-400 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 cursor-pointer bg-indigo-950/20"
                    >
                      {reportLoading ? "Analyzing..." : "AI Report"}
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="text-sm font-medium border border-slate-800 hover:border-indigo-850 text-slate-350 hover:text-indigo-400 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 cursor-pointer bg-slate-900"
                    >
                      {loading ? "Generating..." : "Generate New"}
                    </button>
                    <button
                      onClick={handleCreateRoom}
                      disabled={roomLoading}
                      className="text-sm font-medium border border-indigo-900 hover:border-indigo-850 text-indigo-400 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 cursor-pointer bg-indigo-950/20"
                    >
                      {roomLoading ? "Creating..." : "Create Multiplayer Room"}
                    </button>
                  </div>
                </div>

                {aiReport && (
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 mb-5">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <h3 className="font-bold text-white text-base">AI Performance Analysis</h3>
                      </div>
                      <button onClick={() => setAiReport("")} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
                        Dismiss
                      </button>
                    </div>
                    <SimpleMarkdown content={aiReport} />
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {singlePlayerResult.results.map((r, i) => (
                    <div key={i} className="bg-slate-955 border border-slate-850 rounded-xl p-5">
                      <p className="text-sm font-medium text-white mb-3">
                        {i + 1}. {r.question}
                      </p>
                      <div className="flex flex-col gap-2">
                        {r.options.map((opt, oi) => {
                          const isCorrect = oi === r.correctIndex;
                          const isSelected = oi === r.selected;
                          let cls = "border-slate-800 text-slate-350 bg-slate-900/10";
                          if (isCorrect) cls = "border-emerald-900 bg-emerald-950/30 text-emerald-400";
                          else if (isSelected && !isCorrect) cls = "border-red-900 bg-red-950/30 text-red-400";
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
                        <p className="text-xs text-slate-505 mt-2">You skipped this question.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Active Taking View */}
            {singlePlayerActive && !singlePlayerResult && (
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <p className="text-sm font-medium text-slate-400">
                    Question {singlePlayerCurrent + 1} of {quiz.questions.length}
                  </p>
                  <span className="text-xs font-semibold uppercase text-indigo-400">Single Player</span>
                </div>

                <div className="flex gap-1 mb-5">
                  {quiz.questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSinglePlayerCurrent(i)}
                      className={`flex-1 h-1.5 rounded-full transition-colors cursor-pointer ${
                        i === singlePlayerCurrent
                          ? "bg-indigo-500"
                          : singlePlayerAnswers[i] !== -1
                          ? "bg-indigo-800/60"
                          : "bg-slate-850"
                      }`}
                    />
                  ))}
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-xl p-6">
                  <p className="text-base font-medium text-white mb-5">
                    {quiz.questions[singlePlayerCurrent].question}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {quiz.questions[singlePlayerCurrent].options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => handleSinglePlayerSelectAnswer(oi)}
                        className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                          singlePlayerAnswers[singlePlayerCurrent] === oi
                            ? "border-indigo-700 bg-indigo-950/40 text-indigo-300 font-medium"
                            : "border-slate-800 text-slate-300 hover:border-indigo-850 hover:bg-slate-900 bg-slate-900/20 cursor-pointer"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={() => setSinglePlayerCurrent((c) => Math.max(0, c - 1))}
                      disabled={singlePlayerCurrent === 0}
                      className="text-sm font-medium text-slate-455 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>

                    {singlePlayerCurrent === quiz.questions.length - 1 ? (
                      <button
                        onClick={handleSinglePlayerSubmit}
                        className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
                      >
                        Submit Quiz
                      </button>
                    ) : (
                      <button
                        onClick={() => setSinglePlayerCurrent((c) => Math.min(quiz.questions.length - 1, c + 1))}
                        className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Panel: Start or Multiplayer */}
            {!singlePlayerActive && !singlePlayerResult && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-950/40 flex items-center justify-center mx-auto mb-3">
                  <QuizIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-200 mb-1">Quiz Generated!</p>
                <p className="text-xs text-slate-500 mb-5">
                  {quiz.questions.length} questions are ready. Take the quiz yourself or start a multiplayer room.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleStartSinglePlayer}
                    className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 transition-colors cursor-pointer"
                  >
                    Take Quiz (Single Player)
                  </button>
                  <div className="flex items-center gap-2 border border-indigo-900 bg-indigo-950/20 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-indigo-300">Time Limit:</span>
                    <select
                      value={roomDuration}
                      onChange={(e) => setRoomDuration(Number(e.target.value))}
                      className="border-none text-xs bg-slate-950 text-slate-350 focus:ring-1 focus:ring-indigo-500/30 outline-none rounded-lg px-2 py-1"
                    >
                      <option value={60}>1 Minute</option>
                      <option value={120}>2 Minutes</option>
                      <option value={180}>3 Minutes</option>
                      <option value={300}>5 Minutes</option>
                      <option value={600}>10 Minutes</option>
                      <option value={0}>No Limit</option>
                    </select>
                    <button
                      onClick={handleCreateRoom}
                      disabled={roomLoading}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 cursor-pointer"
                    >
                      {roomLoading ? "Creating..." : "Create Room"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RoomPanel({
  room,
  loading,
  answers,
  setAnswers,
  current,
  setCurrent,
  onStart,
  onFinish,
  onSubmit,
  socketConnected,
  aiReport,
  reportLoading,
  onGenerateReport,
  onDismissReport,
}) {
  const q = room.questions[current];
  const alreadySubmitted = room.myAnswers?.length === room.questions.length;

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (room.status !== "active" || !room.duration || !room.startedAt) {
      setTimeLeft(0);
      return undefined;
    }

    const endTime = new Date(room.startedAt).getTime() + room.duration * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [room.status, room.duration, room.startedAt]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (room.status === "active" && room.duration > 0 && room.startedAt && !alreadySubmitted && !room.isHost) {
      const endTime = new Date(room.startedAt).getTime() + room.duration * 1000;
      if (Date.now() >= endTime) {
        onSubmit();
      }
    }
  }, [timeLeft, room.status, room.duration, room.startedAt, alreadySubmitted, room.isHost, onSubmit]);

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => {
      const next = prev.length === room.questions.length ? [...prev] : new Array(room.questions.length).fill(-1);
      next[current] = optionIndex;
      return next;
    });
  };

  return (
    <div className="mt-5 border-t border-slate-800 pt-5">
      {!socketConnected && (
        <div className="mb-4 text-sm text-yellow-400 bg-yellow-950/20 border border-yellow-900/30 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>
            Disconnected from multiplayer server. If this persists, please try logging out and logging back in to sync session keys.
          </span>
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">ROOM CODE</p>
          <p className="text-3xl font-black tracking-[0.25em] text-white">{room.code}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {room.isHost && room.status === "waiting" && (
            <button onClick={onStart} disabled={loading || room.players.length === 0} className="btn-primary text-sm">
              Start Game
            </button>
          )}
          {room.isHost && room.status === "active" && (
            <button onClick={onFinish} disabled={loading} className="text-sm font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 cursor-pointer transition-colors shadow-sm">
              End Quiz
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-5">
        <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-5">
          {room.status === "waiting" && (
            <div className="text-sm text-slate-400">Waiting for the host to start. Players can keep joining with the room code.</div>
          )}

          {room.status !== "waiting" && q && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-400">Question {current + 1} of {room.questions.length}</p>
                <div className="flex items-center gap-3">
                  {room.status === "active" && room.duration > 0 && timeLeft > 0 && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      timeLeft < 15 ? "bg-red-950/40 text-red-400 border border-red-900/30 animate-pulse" : "bg-slate-900 text-indigo-400 border border-slate-800"
                    }`}>
                      ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                  <span className="text-xs font-semibold uppercase text-indigo-400">{room.status}</span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-white mb-4">{q.question}</p>
                <div className="flex flex-col gap-2">
                  {q.options.map((option, index) => {
                    const isCorrect = room.status === "finished" && q.correctIndex === index;
                    const isIncorrect = room.status === "finished" && answers[current] === index && q.correctIndex !== index;
                    const isSelectedActive = room.status === "active" && answers[current] === index;
                    
                    let buttonClass = "border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-800/40 hover:bg-slate-800/50 cursor-pointer";
                    if (isCorrect) {
                      buttonClass = "border-emerald-900/40 bg-emerald-950/30 text-emerald-400 font-medium";
                    } else if (isIncorrect) {
                      buttonClass = "border-red-900/40 bg-red-950/30 text-red-400";
                    } else if (isSelectedActive) {
                      buttonClass = "border-indigo-700 bg-indigo-950/40 text-indigo-300 font-medium";
                    } else if (room.status === "finished" && answers[current] === index) {
                      buttonClass = "border-emerald-900/40 bg-emerald-950/30 text-emerald-400 font-medium";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => room.status === "active" && !alreadySubmitted && selectAnswer(index)}
                        disabled={room.status !== "active" || alreadySubmitted}
                        className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${buttonClass} disabled:cursor-default`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between mt-5">
                <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="text-sm font-medium text-slate-455 disabled:opacity-30 cursor-pointer">
                  Previous
                </button>
                {current === room.questions.length - 1 ? (
                  <button
                    onClick={onSubmit}
                    disabled={loading || room.status !== "active" || alreadySubmitted}
                    className="btn-primary text-sm"
                  >
                    {alreadySubmitted ? "Submitted" : "Submit Answers"}
                  </button>
                ) : (
                  <button onClick={() => setCurrent((c) => Math.min(room.questions.length - 1, c + 1))} className="btn-primary text-sm">
                    Next
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/20">
          <p className="text-sm font-semibold text-slate-300 mb-3">Players</p>
          <div className="flex flex-col gap-2 mb-5">
            {room.players.map((player) => (
              <div key={player.userId} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 truncate">{player.name}</span>
                <span className={player.submitted ? "text-emerald-400" : "text-slate-550"}>{player.submitted ? "Done" : "Joined"}</span>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-slate-300 mb-3">Leaderboard</p>
          <div className="flex flex-col gap-2">
            {room.leaderboard.map((player, index) => (
              <div key={player.userId} className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-sm">
                <span className="font-medium text-slate-200">{index + 1}. {player.name}</span>
                <span className="text-slate-400">{player.score} / {room.questions.length}</span>
              </div>
            ))}
          </div>

          {room.status === "finished" && (
            <div className="mt-4">
              <button
                onClick={onGenerateReport}
                disabled={reportLoading}
                className="w-full text-xs font-semibold bg-indigo-950/20 text-indigo-400 border border-indigo-900 hover:border-indigo-850 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                {reportLoading ? "Analyzing..." : "Generate AI Performance Report"}
              </button>
            </div>
          )}
        </div>
      </div>

      {room.status === "finished" && aiReport && (
        <div className="mt-5 border border-slate-800 bg-slate-950/60 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h3 className="font-bold text-white text-base">AI Performance Analysis</h3>
            </div>
            <button onClick={onDismissReport} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
              Dismiss
            </button>
          </div>
          <SimpleMarkdown content={aiReport} />
        </div>
      )}
    </div>
  );
}

function SimpleMarkdown({ content }) {
  if (!content) return null;
  const lines = content.split("\n");
  return (
    <div className="space-y-3 text-slate-300 text-sm leading-relaxed text-left">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        if (trimmed.startsWith("### ")) {
          return <h4 key={idx} className="text-base font-bold text-white mt-4">{trimmed.replace("### ", "")}</h4>;
        }
        if (trimmed.startsWith("## ")) {
          return <h3 key={idx} className="text-lg font-bold text-white mt-5">{trimmed.replace("## ", "")}</h3>;
        }
        if (trimmed.startsWith("# ")) {
          return <h2 key={idx} className="text-xl font-extrabold text-white mt-6">{trimmed.replace("# ", "")}</h2>;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex gap-2 pl-4">
              <span>•</span>
              <span>{formatBoldText(trimmed.substring(2))}</span>
            </div>
          );
        }
        const numberedMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-2 pl-4">
              <span className="font-bold text-indigo-400">{numberedMatch[1]}.</span>
              <span>{formatBoldText(numberedMatch[2])}</span>
            </div>
          );
        }
        return <p key={idx}>{formatBoldText(trimmed)}</p>;
      })}
    </div>
  );
}

function formatBoldText(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => 
    index % 2 === 1 ? <strong key={index} className="font-bold text-white">{part}</strong> : part
  );
}

function QuizIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
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

function FolderAccordion({ title, documents, selectedDocIds, toggleDoc }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-900 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-350">📁 {title}</span>
        <span className="text-xs text-slate-500">{expanded ? "Collapse" : "Expand"}</span>
      </button>

      {expanded && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-950">
          {documents.map((doc) => {
            const isChecked = selectedDocIds.has(doc._id);
            return (
              <label
                key={doc._id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none ${
                  isChecked
                    ? "bg-indigo-950/30 border-indigo-850 text-indigo-300"
                    : "border-slate-850 hover:border-slate-800 text-slate-400 bg-slate-905"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleDoc(doc._id)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-650 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                />
                <span className="truncate" title={doc.name}>📄 {doc.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
