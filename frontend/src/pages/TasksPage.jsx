import { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import {
  createCalendarEvent,
  createTask,
  deleteCalendarEvent,
  deleteTask,
  listTasks,
  updateTask,
} from "../services/api";

const eventColors = {
  indigo: "bg-indigo-950/40 text-indigo-300 border-indigo-900/50",
  emerald: "bg-emerald-950/40 text-emerald-300 border-emerald-900/50",
  amber: "bg-amber-950/40 text-amber-300 border-amber-900/50",
  rose: "bg-rose-950/40 text-rose-300 border-rose-900/50",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [eventDate, setEventDate] = useState(toDateInput(new Date()));
  const [eventLabel, setEventLabel] = useState("");
  const [eventColor, setEventColor] = useState("indigo");
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    listTasks()
      .then((data) => {
        if (!mounted) return;
        setTasks(data.tasks || []);
        setEvents(data.events || []);
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const eventsByDate = useMemo(() => {
    return events.reduce((map, event) => {
      map[event.date] = [...(map[event.date] || []), event];
      return map;
    }, {});
  }, [events]);

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);
  const days = buildCalendarDays(calendarMonth);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    try {
      const data = await createTask({ title, dueDate });
      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setDueDate("");
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTask = async (task) => {
    try {
      const data = await updateTask(task._id, { completed: !task.completed });
      setTasks((prev) => prev.map((item) => (item._id === task._id ? data.task : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const removeTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const addEvent = async (e) => {
    e.preventDefault();
    if (!eventDate || !eventLabel.trim()) return;
    setError("");
    try {
      const data = await createCalendarEvent({ date: eventDate, label: eventLabel, color: eventColor });
      setEvents((prev) => [...prev, data.event]);
      setEventLabel("");
    } catch (err) {
      setError(err.message);
    }
  };

  const removeEvent = async (id) => {
    try {
      await deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((event) => event._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="animate-fade-in text-slate-100">
      <TopBar title="Tasks" subtitle="Track pending work and mark important study dates" />

      <div className="px-8 pb-10">
        {error && (
          <div className="mb-6 bg-red-950/20 border border-red-900/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-semibold text-white">Pending Tasks</h2>
                <p className="text-sm text-slate-500">{pendingTasks.length} open, {completedTasks.length} completed</p>
              </div>
            </div>

            <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a todo"
                className="flex-1 border border-slate-850 bg-slate-950 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-550 outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border border-slate-850 bg-slate-950 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button className="btn-primary text-sm cursor-pointer" disabled={!title.trim()}>
                Add Task
              </button>
            </form>

            {loading ? (
              <div className="py-12 flex justify-center"><Spinner /></div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...pendingTasks, ...completedTasks].length === 0 && (
                  <div className="text-sm text-slate-500 bg-slate-950/50 border border-dashed border-slate-850 rounded-xl p-6 text-center">
                    No tasks yet.
                  </div>
                )}
                {[...pendingTasks, ...completedTasks].map((task) => (
                  <div key={task._id} className="flex items-center gap-3 border border-slate-850 bg-slate-950/20 rounded-xl px-4 py-3">
                    <button
                      onClick={() => toggleTask(task)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 cursor-pointer ${
                        task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-700 bg-slate-950 text-slate-400"
                      }`}
                      title={task.completed ? "Mark pending" : "Mark complete"}
                    >
                      {task.completed && <CheckIcon className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${task.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                        {task.title}
                      </p>
                      {task.dueDate && <p className="text-xs text-slate-500">Due {formatDate(task.dueDate)}</p>}
                    </div>
                    <button
                      onClick={() => removeTask(task._id)}
                      className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-850 cursor-pointer"
                      title="Delete task"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))} className="icon-button cursor-pointer" title="Previous month">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-white">{calendarMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}</h2>
              <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="icon-button cursor-pointer" title="Next month">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-[11px] font-semibold text-slate-500 py-1">{day}</div>
              ))}
              {days.map((day) => {
                const key = toDateInput(day.date);
                const dayEvents = eventsByDate[key] || [];
                return (
                  <button
                    key={key}
                    onClick={() => setEventDate(key)}
                    className={`min-h-20 rounded-xl border p-2 text-left transition-colors cursor-pointer ${
                      day.inMonth ? "bg-slate-900 border-slate-850 text-slate-200 hover:border-indigo-800" : "bg-slate-950 border-slate-900 text-slate-600"
                    } ${eventDate === key ? "ring-2 ring-indigo-400/40 border-indigo-500/50" : ""}`}
                  >
                    <span className="text-xs font-semibold">{day.date.getDate()}</span>
                    <div className="mt-1 flex flex-col gap-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span key={event._id} className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] ${eventColors[event.color] || eventColors.indigo}`}>
                          {event.label}
                        </span>
                      ))}
                      {dayEvents.length > 2 && <span className="text-[10px] text-slate-500">+{dayEvents.length - 2} more</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <form onSubmit={addEvent} className="border-t border-slate-850 pt-4">
              <p className="text-sm font-semibold text-slate-300 mb-3">Label a Date</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="border border-slate-800 bg-slate-950 text-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <select
                  value={eventColor}
                  onChange={(e) => setEventColor(e.target.value)}
                  className="border border-slate-800 bg-slate-950 text-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="indigo">Indigo</option>
                  <option value="emerald">Emerald</option>
                  <option value="amber">Amber</option>
                  <option value="rose">Rose</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  value={eventLabel}
                  onChange={(e) => setEventLabel(e.target.value)}
                  placeholder="Exam, lab, revision..."
                  className="flex-1 border border-slate-800 bg-slate-950 text-white placeholder-slate-550 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button className="btn-primary text-sm cursor-pointer" disabled={!eventLabel.trim()}>Add</button>
              </div>
            </form>

            <div className="mt-5 flex flex-col gap-2">
              {(eventsByDate[eventDate] || []).map((event) => (
                <div key={event._id} className="flex items-center justify-between gap-2 text-sm border border-slate-850 bg-slate-950/20 rounded-xl px-3 py-2">
                  <span className={`rounded-lg border px-2 py-1 text-xs ${eventColors[event.color] || eventColors.indigo}`}>{event.label}</span>
                  <button onClick={() => removeEvent(event._id)} className="text-slate-500 hover:text-red-400 cursor-pointer" title="Remove label">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function buildCalendarDays(month) {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === first.getMonth() };
  });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function toDateInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Spinner() {
  return <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />;
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M19.228 5.79L18.16 19.673A2.25 2.25 0 0115.916 21.75H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .563c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function ChevronLeftIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
