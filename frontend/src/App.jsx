import { Routes, Route, Navigate } from "react-router-dom";
import SidebarLayout from "./layouts/SidebarLayout";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentWorkspacePage from "./pages/DocumentWorkspacePage";
import FlashcardsPage from "./pages/FlashcardsPage";
import QuizzesPage from "./pages/QuizzesPage";
import TasksPage from "./pages/TasksPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NewtonsCradleLoader from "./components/NewtonsCradleLoader";

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return <NewtonsCradleLoader message="loading..." />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      
      <Route element={user ? <SidebarLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentWorkspacePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
