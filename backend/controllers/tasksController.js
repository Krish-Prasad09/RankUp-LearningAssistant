import Task, { CalendarEvent } from "../models/Task.js";

export const listTasks = async (req, res) => {
  try {
    const [tasks, events] = await Promise.all([
      Task.find({ userId: req.user.id }).sort({ completed: 1, dueDate: 1, createdAt: -1 }),
      CalendarEvent.find({ userId: req.user.id }).sort({ date: 1, createdAt: -1 }),
    ]);
    res.json({ tasks, events });
  } catch (error) {
    console.error("List tasks error:", error);
    res.status(500).json({ error: "Failed to load tasks." });
  }
};

export const createTask = async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Task title is required." });

    const task = await Task.create({
      userId: req.user.id,
      title,
      notes: (req.body.notes || "").trim(),
      dueDate: req.body.dueDate || "",
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task." });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.title === "string") updates.title = req.body.title.trim();
    if (typeof req.body.notes === "string") updates.notes = req.body.notes.trim();
    if (typeof req.body.dueDate === "string") updates.dueDate = req.body.dueDate;
    if (typeof req.body.completed === "boolean") updates.completed = req.body.completed;

    if (updates.title === "") return res.status(400).json({ error: "Task title cannot be empty." });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found." });

    res.json({ task });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task." });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found." });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task." });
  }
};

export const createEvent = async (req, res) => {
  try {
    const date = (req.body.date || "").trim();
    const label = (req.body.label || "").trim();
    if (!date || !label) return res.status(400).json({ error: "Date and label are required." });

    const event = await CalendarEvent.create({
      userId: req.user.id,
      date,
      label,
      color: req.body.color || "indigo",
    });

    res.status(201).json({ event });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Failed to create calendar label." });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!event) return res.status(404).json({ error: "Calendar label not found." });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Failed to delete calendar label." });
  }
};
