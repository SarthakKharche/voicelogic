import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import "./Dashboard.css";

function Dashboard({ user, onStartPractice }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>🎭 VoiceLogic Dashboard</h1>
          <p className="welcome-text">Welcome back, {user?.displayName || user?.email?.split("@")[0] || "Seller"}!</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="hero-section">
          <div className="hero-icon">🎯</div>
          <h2>Master Your Sales Skills</h2>
          <p className="hero-description">
            Practice with AI-powered buyer personas, get instant feedback, and level up your pitch
          </p>
        </div>

        <div className="action-cards">
          <div className="action-card primary" onClick={onStartPractice}>
            <div className="card-icon">🎙️</div>
            <h3>Start Practice Session</h3>
            <p>Choose a buyer persona and practice your pitch</p>
            <button className="card-btn">Begin Training →</button>
          </div>

          <div className="action-card">
            <div className="card-icon">📊</div>
            <h3>View Statistics</h3>
            <p>Track your progress and performance</p>
            <button className="card-btn disabled" disabled>
              Coming Soon
            </button>
          </div>

          <div className="action-card">
            <div className="card-icon">📚</div>
            <h3>Learning Resources</h3>
            <p>Access tips and best practices</p>
            <button className="card-btn disabled" disabled>
              Coming Soon
            </button>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Practice Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Hours Trained</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">-</div>
            <div className="stat-label">Skill Level</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
