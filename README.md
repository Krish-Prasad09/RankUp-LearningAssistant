# RankUp — Smart Learning Assistant

An AI-powered learning assistant with document analysis, flashcards, quizzes, and chat features.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **AI:** Google Gemini API

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB running locally
- Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your actual values
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the frontend proxies API calls to the backend on port 8000.

## Environment Variables
Create a `.env` file in the backend folder using `.env.example` as a template:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `MONGODB_URI` - Your MongoDB connection string
- `PORT` - Server port (default 8000)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Offline" badge in UI | Run `cd backend && npm start` and ensure MongoDB is running |
| Port 8000 in use | Stop the other process or change `PORT` in `.env` |
| API errors on AI features | Set a valid `GEMINI_API_KEY` in `backend/.env` |
