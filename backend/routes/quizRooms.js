import express from "express";
import {
  createRoom,
  getRoom,
  joinRoom,
} from "../controllers/quizRoomsController.js";

const router = express.Router();

router.post("/", createRoom);
router.post("/join", joinRoom);
router.get("/:code", getRoom);

export default router;
