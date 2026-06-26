# 🎓 RankUp — Smart AI Learning Assistant 🚀

RankUp is a next-generation, AI-powered learning assistant designed to transform static study materials into interactive learning experiences. Upload documents, generate custom flashcards & quizzes, collaborate in real-time study rooms, and chat with an intelligent tutor to master any subject.

---

## ✨ Features Spotlight (Interactive)

Explore the capabilities of RankUp by expanding the sections below:

<details>
<summary>💬 <b>AI Chat & Smart Tutor</b></summary>

- **Context-Aware Study:** Upload a PDF document and ask questions directly to it.
- **Two Flexible Modes:**
  1. **Strict Document Mode:** Answers are grounded *only* in the uploaded document.
  2. **Enhanced Document Mode:** Answers combine document context with external general knowledge.
- **Powered by Groq:** Driven by lightning-fast inference models like `llama-3.3-70b-versatile`.
</details>

<details>
<summary>📂 <b>Document Upload & Extraction</b></summary>

- **PDF Parsing:** Automatically extracts text from uploaded PDF files on the fly.
- **Safe Storage:** Keeps files securely indexed to your user account.
- **Recent Activities Log:** Keeps track of your upload history and document interactions.
</details>

<details>
<summary>🎴 <b>AI-Generated Flashcards</b></summary>

- **Instant Cards:** Automatically generates structured flashcards from your documents.
- **Active Recall:** Standard front/back format with flip animations for self-testing.
- **Spaced Study:** Keep track of key terms, definitions, and concepts.
</details>

<details>
<summary>📝 <b>Interactive & Collaborative Quizzes</b></summary>

- **Dynamic Quizzes:** Generates custom-made multiple-choice questions based on your PDFs.
- **Multiplayer Quiz Rooms:** Create or join study rooms using WebSockets (Socket.io) to compete with peers in real-time.
- **Instant Grading:** Get instant feedback and detailed explanations for every response.
</details>

<details>
<summary>📅 <b>Study Planner & Tasks</b></summary>

- **AI-Powered Subtasks:** Break down major studying tasks into smaller, actionable sub-steps automatically.
- **Progress Tracking:** Interactive checklist to monitor your daily and weekly progress.
</details>

<details>
<summary>🔐 <b>Secure Authentication</b></summary>

- **Traditional Login:** Email/password-based registrations with encrypted passwords (bcrypt).
- **Google One Tap:** Fast and seamless login using Google OAuth 2.0 integration.
</details>

---

## 🛠️ Tech Stack

RankUp uses a modern, robust MERN-based architecture:

*   **Frontend:** React 18, Vite, Tailwind CSS (v4) 🎨
*   **Backend:** Node.js, Express, Socket.io (WebSockets) ⚡
*   **Database:** MongoDB, Mongoose ODM 💾
*   **AI Inference:** Groq API (using `llama-3.3-70b-versatile`) 🤖
*   **Auth:** JWT (JSON Web Tokens) & Google OAuth 2.0 🔒

---

## 🚀 How to Run Locally

Get RankUp up and running on your local machine in just a few minutes.

### 📋 Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas cloud URI)
*   [Groq API Key](https://console.groq.com/) (for AI features)

---

### 📥 Setup & Installation

Follow these steps to set up the project:

#### 1. Clone the repository
```bash
git clone https://github.com/Krish-Prasad09/RankUp-LearningAssistant.git
cd RankUp-LearningAssistant
```

#### 2. Install Root Dependencies
First, install the root packages (this installs `concurrently` to run frontend and backend simultaneously):
```bash
npm install
```

#### 3. Configure the Backend
Navigate to the `backend` folder, create a `.env` file, and install dependencies:
```bash
cd backend
npm install
```

Create a file named `.env` in the `backend` directory and add the following details:
```env
# Server Configuration
PORT=8000
JWT_SECRET=your_custom_jwt_secret_key_here

# MongoDB Configuration
# Falls back to mongodb://localhost:27017/ai-learning-assistant if not specified
MONGODB_URI=mongodb://localhost:27017/rankup

# AI Provider Configuration (Groq)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### 4. Configure the Frontend
Navigate to the `frontend` folder and install dependencies:
```bash
cd ../frontend
npm install
```

---

### 🖥️ Running the Application

You have two options to run the application locally:

#### 💡 Option A: Run Concurrently (Recommended)
From the **root folder** of the project, run:
```bash
npm run dev
```
This single command spins up:
*   **Backend server** at [http://localhost:8000](http://localhost:8000)
*   **Frontend dev server** at [http://localhost:5173](http://localhost:5173)

#### 🛠️ Option B: Run Individually
If you prefer running them in separate terminals:

*   **Terminal 1 (Backend):**
    ```bash
    cd backend
    npm start
    ```
*   **Terminal 2 (Frontend):**
    ```bash
    cd frontend
    npm run dev
    ```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)** to start learning! 🚀

---

## 🌐 Production Deployment (Render + Vercel)

Deploy RankUp in a split-architecture setup for maximum performance and cost efficiency.

### 1. 🖥️ Backend Deployment: Render (Web Service)
1. **Sign Up/Log In:** Connect your GitHub account to [Render](https://render.com/).
2. **Create a New Web Service:**
   - Select **Web Service** and choose your repository.
   - Set **Root Directory** to `backend` (under Advanced Settings).
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. **Environment Variables:**
   Add these in Render under the **Environment** tab:
   - `NODE_ENV` = `production`
   - `GROQ_API_KEY` = *Your Groq API Key*
   - `MONGODB_URI` = *Your MongoDB Atlas connection string*
   - `JWT_SECRET` = *Your custom secret key for signing tokens*
   - `CLIENT_URL` = *Your Vercel deployment URL (e.g. `https://your-app.vercel.app` — update this once you have your Vercel URL)*

---

### 2. 🎨 Frontend Deployment: Vercel (Static Hosting)
1. **Sign Up/Log In:** Connect your GitHub account to [Vercel](https://vercel.com/).
2. **Import Project:**
   - Choose your repository.
   - In the project configuration, set **Root Directory** to `frontend`.
   - **Framework Preset:** `Vite` (Vercel automatically detects this).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables:**
   Configure these in Vercel before hitting Deploy:
   - `VITE_API_URL` = `https://your-backend-on-render.onrender.com/api` (use your actual Render backend service URL)
   - `VITE_SOCKET_URL` = `https://your-backend-on-render.onrender.com` (your backend URL without the `/api` path)
4. **Deploy:** Click **Deploy**. Vercel will handle the build. The pre-configured `frontend/vercel.json` file will automatically ensure React Router works correctly when pages are reloaded or navigated to directly.

---

## 🔒 Environment Variable Details

Here's a breakdown of the backend environment variables:

| Variable | Description | Required? | Default / Fallback |
| :--- | :--- | :---: | :--- |
| `PORT` | The port the backend server runs on. | ❌ | `8000` |
| `MONGODB_URI` | The connection string for your MongoDB database. | ❌ | `mongodb://localhost:27017/ai-learning-assistant` |
| `JWT_SECRET` | Secret key used for signing JWT login tokens. | ❌ | `fallbacksecretkey123` |
| `GROQ_API_KEY` | Your Groq Cloud Console API Key. | **YES** | *None* |
| `GROQ_MODEL` | The LLM model to request from Groq. | ❌ | `llama-3.3-70b-versatile` |
| `GOOGLE_CLIENT_ID` | Client ID from Google Cloud Console for OAuth login. | ❌ | *Falls back to direct API token verification* |

---

## 🛠️ Interactive Troubleshooting FAQ

<details>
<summary>🔴 <b>The UI displays an "Offline" badge. What should I do?</b></summary>

Make sure your backend server is active. Check that you ran `npm run dev` from the root directory, or `npm start` in the `backend` folder. Also, ensure your local MongoDB service is started and running.
</details>

<details>
<summary>🔑 <b>How do I get a Groq API Key?</b></summary>

1. Head over to the [Groq Cloud Console](https://console.groq.com/).
2. Create an account or sign in.
3. Navigate to **API Keys** in the sidebar.
4. Click **Create API Key**, copy it, and paste it into `backend/.env`.
</details>

<details>
<summary>🌍 <b>My Google login is failing. How do I configure Google OAuth?</b></summary>

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Setup your OAuth consent screen and create credentials for a **Web Application**.
3. Add `http://localhost:5173` as an Authorized JavaScript Origin.
4. Copy the Client ID and add it as `GOOGLE_CLIENT_ID` in `backend/.env`.
*(Note: If you don't configure Google OAuth, standard email & password sign-up/login will still work perfectly!)*
</details>

<details>
<summary>⚡ <b>Port 8000 or 5173 is already in use. How can I fix this?</b></summary>

- For backend: Set a different port in `backend/.env` (e.g., `PORT=8080`).
- For frontend: Vite will automatically suggest and run on another port (e.g., `5174`) if `5173` is occupied.
</details>

---

⭐ **Like the project?** Give it a star on GitHub! Happy learning! 🎓

