import express from "express";
import {
  createRoom,
  finishRoom,
  getRoom,
  joinRoom,
  startRoom,
  submitRoomAnswers,
} from "../controllers/quizRoomsController.js";

const router = express.Router();

router.post("/", createRoom);
router.post("/join", joinRoom);
router.get("/:code", getRoom);
router.post("/:code/start", startRoom);
router.post("/:code/submit", submitRoomAnswers);
router.post("/:code/finish", finishRoom);

export default router;
