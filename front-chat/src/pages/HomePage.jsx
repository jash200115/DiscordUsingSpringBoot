import { useState } from "react";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";

// ─── Animated background blobs ───────────────────────────────────────────────
const BackgroundBlobs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div
      style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(88,101,242,0.25) 0%, transparent 70%)",
        top: "-100px",
        left: "-100px",
        animation: "blobFloat1 8s ease-in-out infinite",
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(87,242,135,0.15) 0%, transparent 70%)",
        bottom: "-80px",
        right: "-80px",
        animation: "blobFloat2 10s ease-in-out infinite",
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(235,69,158,0.12) 0%, transparent 70%)",
        top: "40%",
        left: "60%",
        animation: "blobFloat3 12s ease-in-out infinite",
      }}
    />
    <style>{`
      @keyframes blobFloat1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(40px, 30px) scale(1.08); }
      }
      @keyframes blobFloat2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-30px, -40px) scale(1.05); }
      }
      @keyframes blobFloat3 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(20px, -20px) scale(1.1); }
      }
      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeSlideDown {
        from { opacity: 0; transform: translateY(-16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.93); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes shimmer {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .card-animate   { animation: scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
      .title-animate  { animation: fadeSlideDown 0.5s ease both 0.1s; }
      .form-animate   { animation: fadeSlideIn 0.5s ease both 0.2s; }
      .input-focus:focus {
        border-color: #5865f2 !important;
        box-shadow: 0 0 0 3px rgba(88,101,242,0.25);
        outline: none;
      }
      .tab-pill {
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      .submit-btn {
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      .submit-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
      .submit-btn:active { transform: translateY(1px); }
      .submit-btn::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
        transform: translateX(-100%);
        transition: transform 0.4s ease;
      }
      .submit-btn:hover::after { transform: translateX(100%); }
      .discord-logo { animation: fadeSlideDown 0.6s ease both; }
      .spinner {
        width: 18px; height: 18px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        display: inline-block;
      }
      .error-shake {
        animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
      }
      @keyframes shake {
        10%, 90% { transform: translateX(-1px); }
        20%, 80% { transform: translateX(2px); }
        30%, 50%, 70% { transform: translateX(-3px); }
        40%, 60% { transform: translateX(3px); }
      }
    `}</style>
  </div>
);

// ─── Discord Wordmark SVG ─────────────────────────────────────────────────────
const DiscordIcon = () => (
  <svg width="32" height="32" viewBox="0 0 127.14 96.36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
      fill="#5865F2"
    />
  </svg>
);

// ─── Input Field ──────────────────────────────────────────────────────────────
const InputField = ({ label, type = "text", value, onChange, placeholder, autoComplete }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#b5bac1",
      marginBottom: 6,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {label} <span style={{ color: "#ed4245" }}>*</span>
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="input-focus"
      style={{
        width: "100%",
        background: "#1e1f22",
        border: "1px solid #3f4147",
        borderRadius: 4,
        padding: "10px 12px",
        color: "#dbdee1",
        fontSize: 15,
        fontFamily: "'DM Sans', sans-serif",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxSizing: "border-box",
      }}
    />
  </div>
);

// ─── Main HomePage ────────────────────────────────────────────────────────────
const HomePage = () => {
  const { token, login } = useAuth();
  const navigate = useNavigate();

  // "login" | "register"
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── If already logged in, redirect to room picker (not /chat directly) ──
  if (token) return <Navigate to="/join" />;

  // ── Switch tabs — also clears fields ──
  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  // ── Submit handler ──
  const handleSubmit = async () => {
    // Basic validation
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      setShakeKey(k => k + 1);
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setShakeKey(k => k + 1);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const res = await axios.post("http://localhost:8080/api/auth/login", { email, password });
        login(res.data);
        toast.success("Welcome back! 👋");
        navigate("/chat");
      } else {
        await axios.post("http://localhost:8080/api/auth/register", { email, password });
        toast.success("Account created! Logging you in...");
        // Auto-login after register
        const res = await axios.post("http://localhost:8080/api/auth/login", { email, password });
        login(res.data);
        navigate("/chat");
      }
    } catch (error) {
      setShakeKey(k => k + 1);
      const msg = error?.response?.data;
      if (typeof msg === "string") toast.error(msg);
      else if (mode === "login") toast.error("Invalid email or password.");
      else toast.error("Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#313338",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px 16px",
    }}>
      <BackgroundBlobs />

      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Card */}
      <div
        key={mode} // re-triggers animation on tab switch
        className="card-animate"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
          background: "#2b2d31",
          borderRadius: 8,
          padding: "32px 32px 24px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo + Title */}
        <div className="title-animate" style={{ textAlign: "center", marginBottom: 20 }}>
          <div className="discord-logo" style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <DiscordIcon />
          </div>
          <h1 style={{
            color: "#f2f3f5",
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.3px",
          }}>
            {mode === "login" ? "Welcome back!" : "Create an account"}
          </h1>
          <p style={{ color: "#b5bac1", fontSize: 14, marginTop: 6, marginBottom: 0 }}>
            {mode === "login" ? "We're so excited to see you again!" : "Join the conversation today."}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex",
          background: "#1e1f22",
          borderRadius: 6,
          padding: 3,
          marginBottom: 24,
          gap: 4,
        }}>
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              className="tab-pill"
              onClick={() => switchMode(tab)}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.02em",
                background: mode === tab ? "#5865f2" : "transparent",
                color: mode === tab ? "#fff" : "#80848e",
                boxShadow: mode === tab ? "0 2px 8px rgba(88,101,242,0.35)" : "none",
              }}
            >
              {tab === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div
          key={`${mode}-form-${shakeKey}`}
          className={`form-animate ${shakeKey > 0 ? "error-shake" : ""}`}
          onKeyDown={handleKeyDown}
        >
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && (
            <InputField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          )}

          {/* Submit */}
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "12px 0",
              border: "none",
              borderRadius: 4,
              background: loading
                ? "#4752c4"
                : "linear-gradient(135deg, #5865f2 0%, #4752c4 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 2px 8px rgba(88,101,242,0.4)",
            }}
          >
            {loading && <span className="spinner" />}
            {loading
              ? mode === "login" ? "Logging in..." : "Creating account..."
              : mode === "login" ? "Log In" : "Create Account"
            }
          </button>

          {/* Footer switch */}
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#80848e" }}>
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <span
                  onClick={() => switchMode("register")}
                  style={{ color: "#00aff4", cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={e => e.target.style.textDecoration = "underline"}
                  onMouseLeave={e => e.target.style.textDecoration = "none"}
                >
                  Register
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => switchMode("login")}
                  style={{ color: "#00aff4", cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={e => e.target.style.textDecoration = "underline"}
                  onMouseLeave={e => e.target.style.textDecoration = "none"}
                >
                  Log In
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;