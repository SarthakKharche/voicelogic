import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import "./App.css";
import Login from "./Login";
import Dashboard from "./Dashboard";
import PersonaSelector from "./PersonaSelector";

// Default to local backend in development; override with VITE_API_URL when deploying
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_URL = `${API_BASE}/simulate`;

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // dashboard, persona-selector, practice
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [buyerReply, setBuyerReply] = useState("");
  const [coachFeedback, setCoachFeedback] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAccent, setSelectedAccent] = useState("us");
  const [speechSupported, setSpeechSupported] = useState(
    typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const recognitionRef = useRef(null);
  const voicesRef = useRef([]);
  const utteranceRef = useRef(null);

  const requestMicPermission = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) return true; // fall back to native prompt
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      const blocked = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setError(blocked
        ? "Microphone permission blocked. Allow mic access in the browser and retry."
        : "Microphone unavailable. Check your device audio settings.");
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    if (!speechSupported || typeof window === "undefined") return;

    const populateVoices = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      voicesRef.current = voices;
      if (voices.length && !speechSupported) setSpeechSupported(true);
    };

    populateVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", populateVoices);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", populateVoices);
  }, [speechSupported]);

  const pickVoice = (accent = "us") => {
    if (!voicesRef.current?.length) return null;
    const accentMap = {
      us: ["en-US", "en-CA"],
      uk: ["en-GB", "en-IE"],
      au: ["en-AU", "en-NZ"],
    };
    const targets = accentMap[accent] || accentMap.us;
    const exact = voicesRef.current.find((v) => targets.includes(v.lang));
    if (exact) return exact;
    const fallback = voicesRef.current.find((v) => v.lang?.startsWith?.("en"));
    return fallback || voicesRef.current[0] || null;
  };

  const stopSpeech = () => {
    if (!speechSupported || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const speakBuyerReply = (text) => {
    if (!speechSupported || !text?.trim() || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(selectedAccent);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utteranceRef.current = utterance;
    setIsSpeaking(true);
    setIsPaused(false);
    synth.speak(utterance);
  };

  const startListening = async () => {
    setError("");
    if (isListening || isLoading) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is unavailable. Try Chrome on desktop.");
      return;
    }

    const micOk = await requestMicPermission();
    if (!micOk) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const said = event?.results?.[0]?.[0]?.transcript?.trim() || "";
      setTranscript(said);
      setIsListening(false);
      recognition.stop();
    };
    recognition.onerror = (event) => {
      const message = event?.error === "not-allowed"
        ? "Microphone permission was blocked. Please allow access and try again."
        : event?.error === "no-speech"
          ? "We didn't catch that. Try again closer to the mic."
          : "Could not capture audio. Please try again.";
      setError(message);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSimulate = async () => {
    if (!transcript.trim() || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          user_text: transcript,
          persona_prompt: selectedPersona?.prompt || ""
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.feedback || data?.detail || "Unable to get buyer response. Please try again.");
      }

      stopSpeech();
      setBuyerReply(data?.buyer_reply || "");
      setCoachFeedback(data?.feedback || "");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setBuyerReply("");
      setCoachFeedback("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayBuyerAudio = () => {
    if (!speechSupported || !buyerReply) return;
    const synth = window.speechSynthesis;
    if (synth.paused && utteranceRef.current) {
      synth.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }
    speakBuyerReply(buyerReply);
  };

  const handlePauseBuyerAudio = () => {
    if (!speechSupported || !buyerReply) return;
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setIsPaused(true);
      setIsSpeaking(true);
    }
  };

  const resetConversation = () => {
    setTranscript("");
    setBuyerReply("");
    setCoachFeedback("");
    setError("");
    stopSpeech();
  };

  const handlePersonaSelect = (persona) => {
    setSelectedPersona(persona);
    setView("practice");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    resetConversation();
  };

  const handleStartPractice = () => {
    setView("persona-selector");
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setView("dashboard");
  };

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", fontSize: "24px", fontWeight: "700" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === "dashboard") {
    return <Dashboard user={user} onStartPractice={handleStartPractice} />;
  }

  if (view === "persona-selector") {
    return <PersonaSelector onSelectPersona={handlePersonaSelect} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <button className="change-persona-btn" onClick={() => setView("persona-selector")}>
          🎭 Change Buyer ({selectedPersona?.name || "Random"})
        </button>
        <div className="hero-text">
          <p className="eyebrow">VoiceLogic • AI buyer simulator</p>
          <h1>Pitch, hear the buyer, get coached.</h1>
          <p className="subtitle">
            Record or write your pitch, let the AI buyer react with natural questions, then get instant coaching
            feedback. Optimized for Chrome desktop.
          </p>
        </div>
        <div className="status-row">
          {isListening && <span className="pill listening">Listening…</span>}
          {isLoading && <span className="pill thinking">Thinking…</span>}
          {!isListening && !isLoading && <span className="pill ready">Ready</span>}
        </div>
      </header>

      <div className="layout">
        <section className="card" aria-label="Instructions">
          <div className="card-heading">
            <span className="icon">🎯</span>
            <div>
              <p className="eyebrow">Onboarding</p>
              <h2>How to run a simulation</h2>
            </div>
          </div>
          <ol className="steps">
            <li>Click "Record pitch" and deliver a short pitch or objection handling.</li>
            <li>Hit "Simulate buyer" to get a realistic response.</li>
            <li>Review the buyer reply and coaching feedback below.</li>
          </ol>
          <p className="helper">Tip: Keep it under 20 seconds for faster results.</p>
        </section>

        <section className="card" aria-label="Voice input">
          <div className="card-heading">
            <span className="icon">🎙️</span>
            <div>
              <p className="eyebrow">Pitch input</p>
              <h2>Type or record your pitch</h2>
            </div>
          </div>
          <p className="muted">You can type freely or record; we stop listening after the first result to avoid overlaps.</p>

          <label className="label" htmlFor="typed-pitch">Type your pitch</label>
          <textarea
            id="typed-pitch"
            className="text-entry"
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Write your pitch or objection handling here..."
            disabled={isListening || isLoading}
          />

          <div className="button-row">
            <button className="primary" onClick={startListening} disabled={isListening || isLoading}>
              {isListening ? "Listening…" : "Record pitch"}
            </button>
            <button className="ghost" onClick={resetConversation} disabled={isListening || isLoading}>
              Reset
            </button>
          </div>

          <div className="input-preview">
            <p className="label">You said</p>
            <p className="spoken-text">{transcript || "Waiting for your pitch…"}</p>
          </div>

          <button
            className="secondary full"
            onClick={handleSimulate}
            disabled={!transcript.trim() || isLoading || isListening}
          >
            {isLoading ? "Simulating buyer…" : "Simulate buyer"}
          </button>

          {error && <div className="alert">{error}</div>}
        </section>

        <section className="card wide" aria-label="Conversation">
          <div className="card-heading">
            <span className="icon">💬</span>
            <div>
              <p className="eyebrow">Conversation</p>
              <h2>What the buyer said</h2>
            </div>
          </div>

            <div className="voice-controls">
              <div className="voice-select">
                <label className="label" htmlFor="accent">Buyer accent</label>
                <select
                  id="accent"
                  value={selectedAccent}
                  onChange={(e) => setSelectedAccent(e.target.value)}
                  disabled={!speechSupported}
                >
                  <option value="us">English (US)</option>
                  <option value="uk">English (UK)</option>
                  <option value="au">English (AU/NZ)</option>
                </select>
                {!speechSupported && <p className="helper">Voice playback is unavailable in this browser.</p>}
              </div>
              <button
                className="ghost play-voice"
                onClick={handlePlayBuyerAudio}
                disabled={!buyerReply || isLoading || !speechSupported}
              >
                {isPaused ? "Resume buyer audio" : "Play buyer audio"}
              </button>
              <button
                className="ghost play-voice"
                onClick={handlePauseBuyerAudio}
                disabled={!buyerReply || isLoading || !speechSupported || !isSpeaking}
              >
                Pause
              </button>
            </div>

          <div className="conversation">
            <div className="bubble you">
              <p className="label">You</p>
              <p>{transcript || "Your pitch will appear here."}</p>
            </div>
            <div className="bubble buyer">
              <p className="label">Buyer</p>
              {isLoading ? <div className="spinner" aria-label="Loading" /> : <p>{buyerReply || "Run a simulation to hear from the buyer."}</p>}
            </div>
          </div>
        </section>

        <section className="card wide" aria-label="Feedback">
          <div className="card-heading">
            <span className="icon">📊</span>
            <div>
              <p className="eyebrow">Coaching</p>
              <h2>Feedback</h2>
            </div>
          </div>
          {isLoading ? (
            <div className="feedback loading">Analyzing your pitch…</div>
          ) : (
            <div className="feedback">{coachFeedback || "After the buyer responds, your coach will provide actionable feedback."}</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
