import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import QuizRoom from "../models/QuizRoom.js";
import User from "../models/User.js";
import { canAccess, toRoom } from "../controllers/quizRoomsController.js";

const playerDisconnectTimeouts = new Map();

export function attachQuizRoomsSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecretkey123");
      const user = await User.findById(decoded.id).select("_id");
      if (!user) return next(new Error("User no longer exists."));

      socket.data.userId = String(decoded.id);
      next();
    } catch (error) {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("quiz:join", async ({ code } = {}, ack) => {
      try {
        const userId = socket.data.userId;
        const room = await findJoinableRoom(code, userId);

        const timeoutKey = `${userId}-${room.code}`;
        if (playerDisconnectTimeouts.has(timeoutKey)) {
          clearTimeout(playerDisconnectTimeouts.get(timeoutKey));
          playerDisconnectTimeouts.delete(timeoutKey);
        }

        socket.join(roomChannel(room.code));
        socket.data.quizRoomCode = room.code;
        acknowledge(ack, { room: toRoom(room, userId) });
        await emitRoomUpdate(io, room.code);
      } catch (error) {
        acknowledge(ack, null, error);
      }
    });

    socket.on("quiz:start", async ({ code } = {}, ack) => {
      try {
        const room = await findAccessibleRoom(code, socket.data.userId);
        requireHost(room, socket.data.userId);
        room.status = "active";
        await room.save();
        acknowledge(ack, { room: toRoom(room, socket.data.userId) });
        await emitRoomUpdate(io, room.code);
      } catch (error) {
        acknowledge(ack, null, error);
      }
    });

    socket.on("quiz:submit", async ({ code, answers } = {}, ack) => {
      try {
        const room = await findAccessibleRoom(code, socket.data.userId);
        if (room.status !== "active") throw new Error("Room is not active.");

        const player = room.players.find((p) => String(p.userId) === socket.data.userId);
        if (!player) throw new Error("Join this room first.");

        const normalizedAnswers = Array.isArray(answers) ? answers.map((answer) => parseInt(answer, 10)) : [];
        if (normalizedAnswers.length !== room.questions.length) {
          throw new Error("Answer every question before submitting.");
        }

        player.answers = normalizedAnswers;
        player.score = room.questions.reduce(
          (score, question, index) => score + (normalizedAnswers[index] === question.correctIndex ? 1 : 0),
          0
        );
        player.submittedAt = new Date();

        if (room.players.length > 0 && room.players.every((p) => p.submittedAt)) {
          room.status = "finished";
        }

        await room.save();
        acknowledge(ack, { room: toRoom(room, socket.data.userId) });
        await emitRoomUpdate(io, room.code);
      } catch (error) {
        acknowledge(ack, null, error);
      }
    });

    socket.on("quiz:finish", async ({ code } = {}, ack) => {
      try {
        const room = await findAccessibleRoom(code, socket.data.userId);
        requireHost(room, socket.data.userId);
        room.status = "finished";
        await room.save();
        acknowledge(ack, { room: toRoom(room, socket.data.userId) });
        await emitRoomUpdate(io, room.code);
      } catch (error) {
        acknowledge(ack, null, error);
      }
    });

    socket.on("disconnect", async () => {
      const code = socket.data.quizRoomCode;
      if (!code) return;

      try {
        const room = await QuizRoom.findOne({ code });
        if (!room || room.status === "finished") return;

        if (String(room.hostUserId) === socket.data.userId) {
          room.status = "finished";
          await room.save();

          io.in(roomChannel(code)).emit("quiz:closed", {
            reason: "Host disconnected. The room has been closed.",
          });
          io.in(roomChannel(code)).socketsLeave(roomChannel(code));
          return;
        }

        const userId = socket.data.userId;
        const timeoutKey = `${userId}-${code}`;
        if (playerDisconnectTimeouts.has(timeoutKey)) {
          clearTimeout(playerDisconnectTimeouts.get(timeoutKey));
        }

        const timeoutId = setTimeout(async () => {
          playerDisconnectTimeouts.delete(timeoutKey);
          try {
            const currentRoom = await QuizRoom.findOne({ code });
            if (!currentRoom || currentRoom.status === "finished") return;

            const originalLength = currentRoom.players.length;
            currentRoom.players = currentRoom.players.filter((p) => String(p.userId) !== userId);

            if (currentRoom.players.length < originalLength) {
              if (currentRoom.status === "active" && currentRoom.players.length > 0 && currentRoom.players.every((p) => p.submittedAt)) {
                currentRoom.status = "finished";
              }
              await currentRoom.save();
              await emitRoomUpdate(io, code);
            }
          } catch (err) {
            console.error("Player disconnect timeout handler error:", err);
          }
        }, 5000);

        playerDisconnectTimeouts.set(timeoutKey, timeoutId);
      } catch (error) {
        console.error("Socket disconnect handler error:", error);
      }
    });
  });

  return io;
}

async function findAccessibleRoom(code, userId) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) throw new Error("Room code is required.");

  const room = await QuizRoom.findOne({ code: normalizedCode });
  if (!room) throw new Error("Room not found.");
  if (!canAccess(room, userId)) throw new Error("Join this room first.");
  return room;
}

async function findJoinableRoom(code, userId) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) throw new Error("Room code is required.");

  const room = await QuizRoom.findOne({ code: normalizedCode });
  if (!room) throw new Error("Room not found.");
  if (!canAccess(room, userId)) throw new Error("Join this room first.");
  if (room.status !== "waiting" && !room.players.some((p) => String(p.userId) === userId)) {
    throw new Error("Game already in progress.");
  }
  return room;
}

function requireHost(room, userId) {
  if (String(room.hostUserId) !== userId) throw new Error("Only the host can control the room.");
}

async function emitRoomUpdate(io, code) {
  const room = await QuizRoom.findOne({ code });
  if (!room) return;

  const sockets = await io.in(roomChannel(code)).fetchSockets();
  sockets.forEach((socket) => {
    socket.emit("quiz:room", { room: toRoom(room, socket.data.userId) });
  });
}

function roomChannel(code) {
  return `quiz-room:${code}`;
}

function acknowledge(ack, data, error) {
  if (typeof ack !== "function") return;
  if (error) {
    ack({ ok: false, error: error.message || "Quiz room action failed." });
    return;
  }
  ack({ ok: true, ...data });
}
