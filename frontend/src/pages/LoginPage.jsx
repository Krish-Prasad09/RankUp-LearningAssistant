import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EarthCanvas from "./Earth";

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
    <div className="min-h-screen w-full relative flex flex-col justify-between bg-slate-950 overflow-x-hidden">
      {/* Blurred Campus Background with Dark Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/campus-bg.png"
          alt="Campus Background"
          className="w-full h-full object-cover scale-105 filter blur-[6px] brightness-[0.35] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/75 to-slate-950/90" />
        {/* Ambient radial glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/15 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/15 blur-[130px]" />
      </div>

      {/* Top Header - Shifted Upwards */}
      <header className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 pb-2 px-6 lg:px-12 z-20">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl hero-gradient flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/25">
              📈
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              WELCOME TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300">RANK-UP</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium pl-[52px]">
            Your centralized hub for academic excellence.
          </p>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-300 pl-[52px] md:pl-0">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/documents" className="hover:text-white transition-colors">Study Hub</Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold transition-all shadow-md shadow-indigo-500/20"
          >
            Create Account
          </Link>
        </nav>
      </header>

      {/* Main Content Area: Large Panel on Left, Large Earth on Right */}
      <main className="w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 px-6 lg:px-12 py-6 z-10 my-auto">
        {/* Login Panel (Left) */}
        <div className="w-full lg:w-[460px] max-w-lg bg-slate-900/85 border border-slate-700/60 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl animate-fade-in">
          <div className="mb-6">
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">ACCESS PORTAL</span>
            <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 tracking-tight mt-1 mb-2">
              Sign In.
            </h2>
            <p className="text-sm text-slate-400">Enter your credentials to access your study workspace.</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="mb-5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-2xl px-4 py-3">
              <strong>Note:</strong> Google Client ID not detected in `.env`.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-[48px] rounded-xl font-bold text-base text-white hero-gradient hover:opacity-95 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center cursor-pointer"
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
              <div className="w-full border-t border-slate-700/60" />
            </div>
            <span className="relative bg-[#0f172a] px-3 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
          </div>

          <div className="flex justify-center mb-6">
            <div id="google-signin-btn" className="w-full flex justify-center" style={{ minHeight: "40px" }} />
          </div>

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* Big Rotating Earth (Right) */}
        <div className="w-full lg:w-[620px] xl:w-[680px] flex items-center justify-center">
          <div className="w-full h-[440px] sm:h-[540px] lg:h-[660px] cursor-grab active:cursor-grabbing">
            <EarthCanvas />
          </div>
        </div>
      </main>

      {/* Footer subtle tag */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 z-10">
        RankUp Academic Assistant &copy; {new Date().getFullYear()} &bull; Empowering smarter study
      </footer>
    </div>
  );
}
