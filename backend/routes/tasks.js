import express from "express";
import {
  createEvent,
  createTask,
  deleteEvent,
  deleteTask,
  listTasks,
  updateTask,
} from "../controllers/tasksController.js";

const router = express.Router();

router.get("/", listTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

router.post("/events", createEvent);
router.delete("/events/:id", deleteEvent);

export default router;
