import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, getAuth } from "firebase/auth";
import { auth } from "./firebaseConfig";
import "./Login.css";

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name?.trim()) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
        // reload user to get updated displayName
        await getAuth().currentUser?.reload();
        onLoginSuccess({ ...userCredential.user, displayName: name.trim() || userCredential.user.displayName });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(userCredential.user);
      }
    } catch (err) {
      const errorMessages = {
        "auth/email-already-in-use": "Email already registered. Please login instead.",
        "auth/invalid-email": "Invalid email address.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/invalid-credential": "Invalid email or password.",
      };
      setError(errorMessages[err.code] || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎭 VoiceLogic</h1>
          <p className="login-subtitle">AI-powered sales training platform</p>
        </div>

        <div className="tab-buttons">
          <button
            className={!isRegister ? "active" : ""}
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
          >
            Login
          </button>
          <button
            className={isRegister ? "active" : ""}
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
