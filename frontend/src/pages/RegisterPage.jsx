import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EarthCanvas from "./Earth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return setError("Please fill in all fields.");
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError("");
    try {
      await googleLogin(response.credential);
      navigate("/");
    } catch (err) {
      setError(err.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId || "1234567890-mockclientid.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signup-btn"),
        {
          theme: "filled_blue",
          size: "large",
          width: "360",
          text: "signup_with",
          shape: "rectangular",
        }
      );
    }
  }, [googleLogin]);

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-center items-center bg-slate-950 overflow-x-hidden px-4 py-10">
      {/* Blurred Campus Background with Dark Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/campus-bg.png"
          alt="Campus Background"
          className="w-full h-full object-cover scale-105 filter blur-[4px] brightness-[0.4] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/70 to-slate-950/90" />
        {/* Subtle radial accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-col items-center">
        {/* Hero Header */}
        <div className="text-center mb-8 lg:mb-10 max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-3 backdrop-blur-md">
            🎓 AI-Powered Learning Platform
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white uppercase drop-shadow-lg">
            WELCOME TO RANK-UP
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 font-normal leading-relaxed drop-shadow max-w-2xl mx-auto">
            Your centralized hub for academic excellence. Upload study materials, generate AI flashcards, practice quizzes, and collaborate in real-time.
          </p>
        </div>

        {/* Content Section: Form on Left, Earth on Right */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-12">
          {/* Register Form Card (Left) */}
          <div className="w-full lg:w-1/2 max-w-md bg-slate-900/80 border border-slate-700/60 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex w-12 h-12 rounded-2xl hero-gradient items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/30 mb-4 animate-float">
                📈
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
              <p className="text-sm text-slate-400 mt-1">Get started with your smart learning assistant</p>
            </div>

            {error && (
              <div className="mb-5 bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="mb-5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-2xl px-4 py-3">
                <strong>Note:</strong> Google Client ID not detected in `.env`. Check the documentation to configure Google OAuth.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 btn-primary flex justify-center items-center h-[46px] relative"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/60" />
              </div>
              <span className="relative bg-[#0f172a] px-3 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
            </div>

            <div className="flex justify-center mb-6">
              <div id="google-signup-btn" className="w-full flex justify-center" style={{ minHeight: "40px" }} />
            </div>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          {/* Earth 3D Visual (Right) */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <div className="w-full h-[320px] sm:h-[420px] lg:h-[560px] cursor-grab active:cursor-grabbing">
              <EarthCanvas />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
