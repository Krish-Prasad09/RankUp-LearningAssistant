# 🎓 RankUp — Smart AI Learning Assistant

[![🚀 Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-6366f1?style=for-the-badge)](https://rank-up-learning-assistant.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/AI-Groq_LLaMA_3.3-F54F29?style=flat-square)](https://console.groq.com/)

> 🤖 **RankUp** transforms your boring PDFs into interactive learning experiences — chat with documents, generate flashcards, take AI-quizzes, compete in live multiplayer study rooms, and manage your study tasks all in one place.

---

## ✨ What Can RankUp Do?

<details>
<summary>💬 <b>Chat with Your Documents</b> — Ask anything from your PDF</summary>

Upload any PDF and have a conversation with it:
- 📄 **Document Mode** — Answers strictly from your uploaded file.
- 🌐 **Enhanced Mode** — Combines your document + broad AI knowledge.
- 🧠 Powered by **Groq's LLaMA 3.3 70B** for lightning-fast responses.
</details>

<details>
<summary>🎴 <b>AI Flashcard Generator</b> — Study smarter, not harder</summary>

- ⚡ Instantly generates key-concept flashcards from your PDF.
- 🔄 Flip animation for active recall practice.
- 📥 Export flashcards as a file for offline studying.
</details>

<details>
<summary>📝 <b>Interactive AI Quizzes</b> — Test your knowledge</summary>

- 🎯 Auto-generates multiple-choice questions from your documents.
- ✅ Instant grading with detailed answer explanations.
- 📊 Track your quiz scores and improvement over time.
</details>

<details>
<summary>🏆 <b>Multiplayer Quiz Rooms</b> — Compete with friends!</summary>

- 🔴 **Live real-time** quiz battles using WebSockets (Socket.io).
- 🏠 Create a room and share a code — friends join instantly.
- 📈 Live leaderboard as answers are submitted.
</details>

<details>
<summary>📅 <b>Study Planner & Tasks</b> — Stay organized</summary>

- 🤖 AI breaks down big study goals into actionable sub-tasks.
- ☑️ Interactive checklist to track daily/weekly progress.
</details>

<details>
<summary>🔐 <b>Secure Auth</b> — Your data stays private</summary>

- 📧 Email & password login with encrypted passwords (bcrypt).
- 🔵 One-click **Google Sign-In** via OAuth 2.0.
- 🔑 JWT-based session management with 7-day tokens.
</details>

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| 🎨 **Frontend** | React 18, Vite, Tailwind CSS v4 |
| ⚡ **Backend** | Node.js, Express, Socket.io |
| 💾 **Database** | MongoDB Atlas + Mongoose |
| 🤖 **AI** | Groq API — `llama-3.3-70b-versatile` |
| 🔒 **Auth** | JWT + Google OAuth 2.0 |
| 🌐 **Deployment** | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
RankUp-LearningAssistant/
├── 📂 frontend/          # React + Vite app (UI, pages, components)
├── 📂 backend/           # Express API server (routes, controllers, models)
│   ├── 📂 controllers/   # Business logic for AI, auth, docs, quizzes
│   ├── 📂 models/        # MongoDB schemas (User, Document, QuizRoom, etc.)
│   ├── 📂 routes/        # API route definitions
│   ├── 📂 socket/        # Socket.io WebSocket handlers for live quiz rooms
│   └── 📂 utils/         # Groq AI client & PDF text extraction helpers
└── 📄 package.json       # Root scripts to run both frontend & backend together
```

---

## 🚀 Running Locally

### 📋 Prerequisites
- ✅ [Node.js v18+](https://nodejs.org/)
- ✅ [MongoDB](https://www.mongodb.com/) (local or Atlas cloud URI)
- ✅ [Groq API Key](https://console.groq.com/) — free to get!

---

### ⚡ Quick Start (3 steps)

**Step 1 — Clone & install root dependencies:**
```bash
git clone https://github.com/Krish-Prasad09/RankUp-LearningAssistant.git
cd RankUp-LearningAssistant
npm install
```

**Step 2 — Set up the backend `.env`:**
```bash
cd backend && npm install
```
Create `backend/.env` and fill in:
```env
PORT=8000
JWT_SECRET=your_secret_key_here
MONGODB_URI=mongodb://localhost:27017/rankup
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GOOGLE_CLIENT_ID=your_google_client_id_here   # optional
```

**Step 3 — Install frontend & launch everything:**
```bash
cd ../frontend && npm install
cd ..
npm run dev
```

> 🟢 Frontend → **http://localhost:5173** | 🟡 Backend → **http://localhost:8000**

---

## 🛠️ Troubleshooting

<details>
<summary>🔴 <b>Seeing "Offline" badge in the UI?</b></summary>

Run `npm run dev` from the root folder. Make sure your MongoDB service is also started. If using Atlas, confirm your `MONGODB_URI` in `backend/.env` is correct.
</details>

<details>
<summary>🔑 <b>How do I get a free Groq API Key?</b></summary>

1. Visit [console.groq.com](https://console.groq.com/) and sign up.
2. Go to **API Keys** → **Create API Key**.
3. Copy it into `GROQ_API_KEY` in `backend/.env`.
</details>

<details>
<summary>🌍 <b>Google Sign-In not working?</b></summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create an OAuth 2.0 Web Client.
2. Add `http://localhost:5173` as an **Authorized JavaScript Origin**.
3. Set the Client ID as `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`.
</details>

<details>
<summary>⚡ <b>Port 8000 or 5173 already in use?</b></summary>

- **Backend:** Change `PORT=8080` in `backend/.env`.
- **Frontend:** Vite auto-picks a free port (e.g., 5174).
</details>
