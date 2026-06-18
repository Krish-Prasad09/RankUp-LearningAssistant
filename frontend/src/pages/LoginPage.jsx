import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields.");
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed.");
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
        document.getElementById("google-signin-btn"),
        {
          theme: "filled_blue",
          size: "large",
          width: "360",
          text: "signin_with",
          shape: "rectangular",
        }
      );
    }
  }, [googleLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl hero-gradient items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/30 mb-4 animate-float">
            📈
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to your learning workspace</p>
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
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
              className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
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
              "Sign In"
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50" />
          </div>
          <span className="relative bg-[#1e293b] px-3 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
        </div>

        <div className="flex justify-center mb-6">
          <div id="google-signin-btn" className="w-full flex justify-center" style={{ minHeight: "40px" }} />
        </div>

        <p className="text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
