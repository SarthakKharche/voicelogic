import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [buyer, setBuyer] = useState("");
  const [feedback, setFeedback] = useState("");

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (e) => {
      setText(e.results[0][0].transcript);
    };
    recognition.start();
  };

  const sendToAI = async () => {
    const res = await fetch(
      "https://voicelogic-qt6r.onrender.com/simulate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: text })
      }
    );

    const data = await res.json();
    setBuyer(data.buyer_reply);
    setFeedback(data.feedback);
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>🎙 VoiceLogic</h1>

      <button onClick={startListening}>Start Speaking</button>
      <p><b>You:</b> {text}</p>

      <button onClick={sendToAI} disabled={!text}>
        Simulate Buyer
      </button>

      <hr />

      <h3>🧑 Buyer Response</h3>
      <p>{buyer}</p>

      <h3>📊 AI Feedback</h3>
      <p>{feedback}</p>
    </div>
  );
}

export default App;
