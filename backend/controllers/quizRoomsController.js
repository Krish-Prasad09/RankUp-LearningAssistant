import QuizRoom from "../models/QuizRoom.js";
import User from "../models/User.js";

export const createRoom = async (req, res) => {
  try {
    const questions = normalizeQuestions(req.body.questions);
    if (questions.length < 1) return res.status(400).json({ error: "Generate a quiz before creating a room." });

    const user = await User.findById(req.user.id).select("name");
    const room = await QuizRoom.create({
      code: await makeUniqueCode(),
      hostUserId: req.user.id,
      title: (req.body.title || "Multiplayer Quiz").trim(),
      questions,
      players: [{ userId: req.user.id, name: user?.name || "Host", answers: [] }],
    });

    res.status(201).json({ room: toRoom(room, req.user.id) });
  } catch (error) {
    console.error("Create quiz room error:", error);
    res.status(500).json({ error: "Failed to create quiz room." });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const code = (req.body.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Room code is required." });

    const room = await QuizRoom.findOne({ code });
    if (!room) return res.status(404).json({ error: "Room not found." });
    if (room.status === "finished") return res.status(400).json({ error: "This room has already finished." });

    const alreadyJoined = room.players.some((p) => String(p.userId) === req.user.id);
    if (room.status !== "waiting" && !alreadyJoined) {
      return res.status(400).json({ error: "Game already in progress." });
    }

    if (!alreadyJoined) {
      const user = await User.findById(req.user.id).select("name");
      room.players.push({ userId: req.user.id, name: user?.name || "Player", answers: [] });
      await room.save();
    }

    res.json({ room: toRoom(room, req.user.id) });
  } catch (error) {
    console.error("Join quiz room error:", error);
    res.status(500).json({ error: "Failed to join quiz room." });
  }
};

export const getRoom = async (req, res) => {
  try {
    const room = await QuizRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found." });
    if (!canAccess(room, req.user.id)) return res.status(403).json({ error: "Join this room first." });
    res.json({ room: toRoom(room, req.user.id) });
  } catch (error) {
    console.error("Get quiz room error:", error);
    res.status(500).json({ error: "Failed to load quiz room." });
  }
};

export const startRoom = async (req, res) => {
  try {
    const room = await QuizRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found." });
    if (String(room.hostUserId) !== req.user.id) return res.status(403).json({ error: "Only the host can start the room." });
    room.status = "active";
    await room.save();
    res.json({ room: toRoom(room, req.user.id) });
  } catch (error) {
    console.error("Start quiz room error:", error);
    res.status(500).json({ error: "Failed to start quiz room." });
  }
};

export const submitRoomAnswers = async (req, res) => {
  try {
    const room = await QuizRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found." });
    if (room.status !== "active") return res.status(400).json({ error: "Room is not active." });

    const player = room.players.find((p) => String(p.userId) === req.user.id);
    if (!player) return res.status(403).json({ error: "Join this room first." });

    const answers = Array.isArray(req.body.answers) ? req.body.answers.map((a) => parseInt(a)) : [];
    if (answers.length !== room.questions.length) return res.status(400).json({ error: "Answer every question before submitting." });

    player.answers = answers;
    player.score = room.questions.reduce((score, q, index) => score + (answers[index] === q.correctIndex ? 1 : 0), 0);
    player.submittedAt = new Date();

    if (room.players.length > 0 && room.players.every((p) => p.submittedAt)) {
      room.status = "finished";
    }

    await room.save();
    res.json({ room: toRoom(room, req.user.id) });
  } catch (error) {
    console.error("Submit room answers error:", error);
    res.status(500).json({ error: "Failed to submit multiplayer quiz." });
  }
};

export const finishRoom = async (req, res) => {
  try {
    const room = await QuizRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ error: "Room not found." });
    if (String(room.hostUserId) !== req.user.id) return res.status(403).json({ error: "Only the host can finish the room." });
    room.status = "finished";
    await room.save();
    res.json({ room: toRoom(room, req.user.id) });
  } catch (error) {
    console.error("Finish quiz room error:", error);
    res.status(500).json({ error: "Failed to finish quiz room." });
  }
};

export function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .filter((q) => q?.question && Array.isArray(q.options) && q.options.length === 4)
    .slice(0, 20)
    .map((q) => ({
      question: String(q.question),
      options: q.options.map(String),
      correctIndex: Math.min(Math.max(parseInt(q.correctIndex) || 0, 0), 3),
    }));
}

export async function makeUniqueCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    const exists = await QuizRoom.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Could not create a unique room code.");
}

export function canAccess(room, userId) {
  return String(room.hostUserId) === userId || room.players.some((p) => String(p.userId) === userId);
}

export function toRoom(room, userId) {
  const isHost = String(room.hostUserId) === userId;
  const currentPlayer = room.players.find((p) => String(p.userId) === userId);
  const leaderboard = room.players
    .map((p) => ({
      userId: p.userId,
      name: p.name,
      score: p.score,
      submitted: Boolean(p.submittedAt),
      submittedAt: p.submittedAt,
    }))
    .sort((a, b) => b.score - a.score || new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0));

  return {
    _id: room._id,
    code: room.code,
    title: room.title,
    status: room.status,
    isHost,
    questions: room.questions.map((q) => ({
      question: q.question,
      options: q.options,
      ...(room.status === "finished" ? { correctIndex: q.correctIndex } : {}),
    })),
    players: room.players.map((p) => ({ userId: p.userId, name: p.name, submitted: Boolean(p.submittedAt) })),
    leaderboard,
    myAnswers: currentPlayer?.answers || [],
    myScore: currentPlayer?.score || 0,
    createdAt: room.createdAt,
  };
}
