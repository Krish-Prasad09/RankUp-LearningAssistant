import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, default: "indigo" },
  },
  { _id: true, timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    notes: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);
export default mongoose.model("Task", taskSchema);
