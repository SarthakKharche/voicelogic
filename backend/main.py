import logging
import os
from typing import List

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from openai import OpenAI
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Initialize Firebase Admin
cred_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "voicelogic-firebase-adminsdk-fbsvc-095aacf4b6.json"
)
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="VoiceLogic API", version="0.2.0")

origins_env = os.getenv("CORS_ORIGINS", "*")
allowed_origins: List[str] = [o.strip() for o in origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimulationRequest(BaseModel):
    user_text: str = Field(..., min_length=1, description="User's spoken or typed pitch")
    persona_prompt: str = Field(
        default="",
        description="Optional persona-specific instructions for buyer behavior",
    )


def _ensure_api_key() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set")


def _generate_buyer_reply(user_text: str, persona_prompt: str = "") -> str:
    _ensure_api_key()
    
    persona_instruction = persona_prompt if persona_prompt else (
        "You are a real buyer in a conversation. Respond naturally like a human talking. "
        "Use informal speech, show skepticism, ask a few quick questions, maybe push back a little."
    )
    
    prompt = f"""
{persona_instruction}

Keep it SHORT—just 2-4 sentences max. Sound like you're actually speaking, not writing a structured document.

FORBIDDEN: numbered lists, bullet points, bold text, asterisks, headers like "Buyer Persona", formal structure. Just talk.

Salesperson says:
{user_text}

Your reply (as if speaking out loud):"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a real buyer in a sales conversation. Speak naturally and casually like a human would in real life. "
                    "NO formatting, NO numbered lists, NO bullet points, NO asterisks, NO bold. Just plain conversational speech."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.9,
    )
    return response.choices[0].message.content


def _generate_feedback(user_text: str, buyer_reply: str) -> str:
    _ensure_api_key()
    feedback_prompt = f"""
Analyze the salesperson's pitch and the buyer's reaction.
Provide concise coaching feedback with 2-3 actionable suggestions.

Salesperson pitch:
{user_text}

Buyer reply:
{buyer_reply}
"""

    feedback = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a sales coach."},
            {"role": "user", "content": feedback_prompt},
        ],
    )
    return feedback.choices[0].message.content


def verify_firebase_token(authorization: str = Header(None)) -> dict:
    """Verify Firebase ID token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.post("/simulate")
async def simulate_buyer(data: SimulationRequest, authorization: str = Header(None)):
    # Verify authentication
    user_info = verify_firebase_token(authorization)
    logger.info(f"Authenticated user: {user_info.get('email')}")
    
    user_text = data.user_text.strip()
    if not user_text:
        return JSONResponse(
            status_code=400,
            content={
                "buyer_reply": "",
                "feedback": "Please share your pitch before simulating the buyer.",
            },
        )

    try:
        buyer_reply = _generate_buyer_reply(user_text, data.persona_prompt)
        feedback = _generate_feedback(user_text, buyer_reply)
        return {"buyer_reply": buyer_reply, "feedback": feedback}
    except Exception as exc:  # noqa: BLE001
        logger.exception("simulate_buyer failed", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={
                "buyer_reply": "Our buyer is thinking—please retry in a moment.",
                "feedback": "We hit a temporary issue reaching the AI service. Try again shortly.",
            },
        )
