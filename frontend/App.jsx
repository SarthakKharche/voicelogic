import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [buyer, setBuyer] = useState("");
  const [feedback, setFeedback] = useState("");

  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (e) => {
      setText(e.results[0][0].transcript);
    };
    recognition.start();
  };

  const sendToAI = async () => {
    const res = await fetch("https://voicelogic-qt6r.onrender.com/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_text: text })
    });
    const data = await res.json();
    setBuyer(data.buyer_reply);
    setFeedback(data.feedback);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>VoiceLogic</h1>

      <button onClick={startListening}>🎙 Speak</button>
      <p>{text}</p>

      <button onClick={sendToAI}>Simulate Buyer</button>

      <h3>Buyer Response</h3>
      <p>{buyer}</p>

      <h3>AI Feedback</h3>
      <p>{feedback}</p>
    </div>
  );
}

export default App;
