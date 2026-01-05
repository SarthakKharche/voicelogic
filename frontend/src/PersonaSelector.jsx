import { useState } from "react";
import "./PersonaSelector.css";

const PERSONAS = [
  {
    id: "detail_analyst",
    name: "Detail-Oriented Analyst",
    difficulty: "hard",
    difficultyLabel: "HARD",
    description: "Methodical, needs all information, makes spreadsheets",
    subtitle: "Step by step sochta hai, har detail chahiye, spreadsheet banata hai",
    traits: {
      patience: 75,
      analytical: 95,
      emotional: 20,
    },
    prompt:
      "You are a meticulous buyer who wants every detail before deciding. Ask specific technical questions, request data/proof, be methodical and slow to commit. Sound professional but skeptical.",
  },
  {
    id: "emotional_first_timer",
    name: "Emotional First-Time Buyer",
    difficulty: "easy",
    difficultyLabel: "EASY",
    description: "Nervous, excited, easily overwhelmed, needs reassurance",
    subtitle: "Ghabrahat hai, excitement hai, jaldi confuse ho jata hai, bharosa chahiye",
    traits: {
      patience: 65,
      analytical: 35,
      emotional: 90,
    },
    prompt:
      "You are a first-time buyer who is excited but nervous and unsure. Ask for reassurance, get a bit overwhelmed by too much info, need simple explanations. Show enthusiasm mixed with hesitation.",
  },
  {
    id: "experienced_negotiator",
    name: "Experienced Negotiator",
    difficulty: "expert",
    difficultyLabel: "EXPERT",
    description: "Master tactician, uses silence and pressure, knows all the tricks",
    subtitle: "Master negotiator, chup rehkar pressure banata hai, sab tactics jaanta hai",
    traits: {
      patience: 95,
      analytical: 80,
      emotional: 25,
    },
    prompt:
      "You are a seasoned buyer who has seen every sales trick. Push back hard on pricing, use silence strategically, challenge every claim, negotiate aggressively. Be calm but tough.",
  },
  {
    id: "budget_conscious",
    name: "Budget-Conscious Buyer",
    difficulty: "medium",
    difficultyLabel: "MEDIUM",
    description: "Price-sensitive, always comparing alternatives, needs value proof",
    subtitle: "Paise ki fikr hai, alternatives compare karta hai, value chahiye",
    traits: {
      patience: 50,
      analytical: 70,
      emotional: 40,
    },
    prompt:
      "You are price-sensitive and always looking for the best deal. Constantly mention competitors, ask about discounts, question the value proposition. Be friendly but firm about budget constraints.",
  },
  {
    id: "decision_maker_rush",
    name: "Rushed Decision Maker",
    difficulty: "medium",
    difficultyLabel: "MEDIUM",
    description: "Busy, wants quick answers, no time for details, impatient",
    subtitle: "Busy hai, jaldi chahiye, details mein time nahi, impatient hai",
    traits: {
      patience: 20,
      analytical: 50,
      emotional: 45,
    },
    prompt:
      "You are extremely busy and have no time for long pitches. Interrupt if the seller takes too long, ask for the bottom line immediately, make quick snap judgments. Be impatient and direct.",
  },
  {
    id: "skeptical_researcher",
    name: "Skeptical Researcher",
    difficulty: "hard",
    difficultyLabel: "HARD",
    description: "Questions everything, fact-checks, sees through fluff",
    subtitle: "Har baat pe sawaal, fact-check karta hai, bakwaas pakad leta hai",
    traits: {
      patience: 60,
      analytical: 90,
      emotional: 15,
    },
    prompt:
      "You are highly skeptical and research everything. Challenge claims with counterexamples, ask for proof/references, call out vague statements. Be polite but relentlessly questioning.",
  },
];

function PersonaSelector({ onSelectPersona, onBack }) {
  const [filter, setFilter] = useState("all");

  const filteredPersonas =
    filter === "all"
      ? PERSONAS
      : PERSONAS.filter((p) => p.difficulty === filter);

  const handleRandomSelect = () => {
    const randomPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
    onSelectPersona(randomPersona);
  };

  return (
    <div className="persona-selector">
      <div className="persona-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="persona-title">
          <h1>Select a Buyer Persona</h1>
          <p className="persona-subtitle">Choose who you want to practice with</p>
        </div>
      </div>

      <div className="filter-section">
        <h3>Filter by Difficulty</h3>
        <div className="filter-buttons">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All Personas
          </button>
          <button
            className={filter === "easy" ? "active" : ""}
            onClick={() => setFilter("easy")}
          >
            Easy
          </button>
          <button
            className={filter === "medium" ? "active" : ""}
            onClick={() => setFilter("medium")}
          >
            Medium
          </button>
          <button
            className={filter === "hard" ? "active" : ""}
            onClick={() => setFilter("hard")}
          >
            Hard
          </button>
          <button
            className={filter === "expert" ? "active" : ""}
            onClick={() => setFilter("expert")}
          >
            Expert
          </button>
        </div>
      </div>

      <div className="random-section">
        <button className="random-btn" onClick={handleRandomSelect}>
          🎲 Random Buyer
        </button>
      </div>

      <div className="persona-grid">
        {filteredPersonas.map((persona) => (
          <div
            key={persona.id}
            className="persona-card"
            onClick={() => onSelectPersona(persona)}
          >
            <div className="persona-card-header">
              <h3>{persona.name}</h3>
              <span className={`difficulty-badge ${persona.difficulty}`}>
                ⚡ {persona.difficultyLabel}
              </span>
            </div>
            <p className="persona-description">{persona.description}</p>
            <p className="persona-subtitle-text">{persona.subtitle}</p>
            <div className="traits">
              <h4>Key Traits</h4>
              <div className="trait">
                <span>Patience</span>
                <div className="trait-bar">
                  <div
                    className="trait-fill"
                    style={{ width: `${persona.traits.patience}%` }}
                  />
                </div>
              </div>
              <div className="trait">
                <span>Analytical</span>
                <div className="trait-bar">
                  <div
                    className="trait-fill"
                    style={{ width: `${persona.traits.analytical}%` }}
                  />
                </div>
              </div>
              <div className="trait">
                <span>Emotional</span>
                <div className="trait-bar">
                  <div
                    className="trait-fill"
                    style={{ width: `${persona.traits.emotional}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PersonaSelector;
