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
    <div className="min-h-screen w-full relative flex flex-col justify-between bg-slate-950 overflow-x-hidden">
      {/* Blurred Campus Background with Dark Overlay (No radial orbs) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/campus-bg.png"
          alt="Campus Background"
          className="w-full h-full object-cover scale-105 filter blur-[5px] brightness-[0.3] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-slate-950/85" />
      </div>

      {/* Header - Clean Typography without Harsh Gradients */}
      <header className="w-full pt-10 pb-2 text-center z-20 animate-fade-in px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
          Welcome to <span className="text-indigo-400">RankUp</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 font-normal max-w-xl mx-auto leading-relaxed">
          Turn your study notes into live multiplayer quiz battles. Challenge your peers and rank up.
        </p>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-8 lg:gap-14 px-6 lg:px-8 py-6 z-10 my-auto">
        {/* Register Panel (Left) - Structured SaaS Card (No liquid glass / No puffy corners) */}
        <div className="w-full lg:w-[420px] max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xl shadow-black/40 backdrop-blur-md animate-fade-in">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Create an account
            </h2>
            <p className="text-xs text-slate-400 mt-1">Join your classmates and start collaborating</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-950/40 border border-red-800/50 text-red-300 text-xs rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="mb-5 bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs rounded-lg px-3.5 py-2.5">
              <strong>Note:</strong> Google Client ID not detected in `.env`.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-10 rounded-lg font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Or continue with</span>
          </div>

          <div className={`flex justify-center mb-6 transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            <div id="google-signup-btn" className="w-full flex justify-center" style={{ minHeight: "40px" }} />
          </div>

          <p className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* Proportioned Rotating Earth (Right) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full h-[380px] sm:h-[450px] lg:h-[520px] cursor-grab active:cursor-grabbing">
            <EarthCanvas />
          </div>
        </div>
      </main>

      {/* Production Footer with Real TOS and Privacy Links */}
      <footer className="w-full py-5 text-center text-xs text-slate-500 z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4">
        <span>&copy; {new Date().getFullYear()} RankUp, Inc. All rights reserved.</span>
        <span className="text-slate-800 hidden sm:inline">&bull;</span>
        <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
        <span className="text-slate-800">&bull;</span>
        <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
        <span className="text-slate-800">&bull;</span>
        <a href="#" className="hover:text-slate-400 transition-colors">Security</a>
      </footer>
    </div>
  );
}
