import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import {
  createQuizRoom,
  generateQuizFromFolders,
  joinQuizRoom,
  listFolders,
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

  const syncRoomAnswers = (nextRoom) => {
    setRoomAnswers((prev) => {
      if (nextRoom.myAnswers?.length === nextRoom.questions.length) return nextRoom.myAnswers;
      if (prev.length === nextRoom.questions.length) return prev;
      return new Array(nextRoom.questions.length).fill(-1);
    });
  };

  useEffect(() => {
    listFolders("/")
      .then((d) => setFolders(d.folders || []))
      .catch(() => setFolders([]));
  }, []);

  useEffect(() => {
    if (!room?.code) return undefined;

    const socket = getQuizSocket();
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

    socket.on("quiz:room", handleRoomUpdate);
    socket.on("quiz:closed", handleRoomClosed);
    socket.on("connect_error", handleSocketError);
    joinQuizSocketRoom(room.code)
      .then(({ room: nextRoom }) => handleRoomUpdate({ room: nextRoom }))
      .catch((err) => setRoomError(err.message));

    return () => {
      socket.off("quiz:room", handleRoomUpdate);
      socket.off("quiz:closed", handleRoomClosed);
      socket.off("connect_error", handleSocketError);
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
    if (selected.size === 0) return setError("Select at least one folder to generate a quiz from.");
    setError("");
    setLoading(true);
    try {
      const resp = await generateQuizFromFolders(Array.from(selected), { difficulty, sourceMode, total });
      setQuiz(resp.quiz);
      setRoom(null);
      setConcealGeneratedQuiz(false);
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
      const data = await createQuizRoom({ title: "RankUp Multiplayer Quiz", questions: quiz.questions });
      setRoom(data.room);
      setConcealGeneratedQuiz(true);
      syncRoomAnswers(data.room);
      setRoomCurrent(0);
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
      const data = await finishQuizSocketRoom(room.code);
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

  return (
    <div className="animate-fade-in text-slate-100">
      <TopBar title="Quizzes" subtitle="Generate quizzes from your document folders" />

      <div className="px-8 pb-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-300 mb-4">Choose folders</p>
          <div className="flex flex-wrap gap-2">
            {folders.length === 0 && (
              <div className="text-sm text-slate-500">No folders yet. Create folders from Documents.</div>
            )}
            {folders.map((f) => (
              <button
                key={f.path}
                onClick={() => toggle(f.path)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  selected.has(f.path)
                    ? "bg-indigo-950/40 border-indigo-800 text-indigo-300 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-350 hover:border-indigo-800"
                }`}
              >
                📁 {f.name}
              </button>
            ))}
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
            />
          )}
        </div>

        {quiz && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <p className="text-sm font-semibold text-indigo-400">Generated Quiz</p>
              <button
                onClick={handleCreateRoom}
                disabled={roomLoading}
                className="text-sm font-medium border border-indigo-900 hover:border-indigo-850 text-indigo-400 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {roomLoading ? "Creating..." : "Create Multiplayer Room"}
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {quiz.questions.map((q, i) => (
                <div key={i} className="relative p-5 border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">
                  <div className={concealGeneratedQuiz ? "blur select-none pointer-events-none" : ""}>
                    <div className="font-semibold text-slate-200 mb-3">{i + 1}. {q.question}</div>
                    <div className="flex flex-col gap-2">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`px-4 py-2.5 rounded-xl text-sm ${
                            q.correctIndex === oi
                              ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 font-medium"
                              : "bg-slate-900 border border-slate-850 text-slate-350"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  {concealGeneratedQuiz && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-sm font-semibold text-slate-400">
                      Hidden while multiplayer room is active
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomPanel({ room, loading, answers, setAnswers, current, setCurrent, onStart, onFinish, onSubmit }) {
  const q = room.questions[current];
  const allAnswered = answers.length === room.questions.length && answers.every((a) => a !== -1);
  const alreadySubmitted = room.myAnswers?.length === room.questions.length;

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => {
      const next = prev.length === room.questions.length ? [...prev] : new Array(room.questions.length).fill(-1);
      next[current] = optionIndex;
      return next;
    });
  };

  return (
    <div className="mt-5 border-t border-slate-800 pt-5">
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
            <button onClick={onFinish} disabled={loading} className="text-sm font-medium border border-slate-800 text-slate-400 rounded-xl px-4 py-2 cursor-pointer hover:bg-slate-800">
              Finish
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
                <span className="text-xs font-semibold uppercase text-indigo-400">{room.status}</span>
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
                <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="text-sm font-medium text-slate-450 disabled:opacity-30 cursor-pointer">
                  Previous
                </button>
                {current === room.questions.length - 1 ? (
                  <button
                    onClick={onSubmit}
                    disabled={!allAnswered || loading || room.status !== "active" || alreadySubmitted}
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
        </div>
      </div>
    </div>
  );
}
