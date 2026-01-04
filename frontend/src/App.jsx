import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "https://voicelogic-qt6r.onrender.com/simulate";

function App() {
  const [transcript, setTranscript] = useState("");
  const [buyerReply, setBuyerReply] = useState("");
  const [coachFeedback, setCoachFeedback] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);

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
    return () => {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
    };
  }, []);

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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: transcript })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.feedback || data?.detail || "Unable to get buyer response. Please try again.");
      }

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

  const resetConversation = () => {
    setTranscript("");
    setBuyerReply("");
    setCoachFeedback("");
    setError("");
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-text">
          <p className="eyebrow">VoiceLogic • AI buyer simulator</p>
          <h1>Pitch, hear the buyer, get coached.</h1>
          <p className="subtitle">
            Record your pitch, let the AI buyer react, then get instant coaching feedback.
            Optimized for Chrome desktop.
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
              <p className="eyebrow">Voice input</p>
              <h2>Record your pitch</h2>
            </div>
          </div>
          <p className="muted">We stop listening after the first result to avoid overlapping recordings.</p>

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
