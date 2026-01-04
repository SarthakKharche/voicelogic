import logging
import os
from typing import List

import openai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

openai.api_key = os.getenv("OPENAI_API_KEY")

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
    user_text: str = Field(..., min_length=1, description="User's spoken pitch")


def _ensure_api_key() -> None:
    if not openai.api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")


def _generate_buyer_reply(user_text: str) -> str:
    _ensure_api_key()
    prompt = f"""
You are a realistic buyer persona for sales training.
React naturally, raise objections, and negotiate based on the salesperson's pitch.

Salesperson says:
{user_text}
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a realistic buyer."},
            {"role": "user", "content": prompt},
        ],
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

    feedback = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a sales coach."},
            {"role": "user", "content": feedback_prompt},
        ],
    )
    return feedback.choices[0].message.content


@app.post("/simulate")
async def simulate_buyer(data: SimulationRequest):
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
        buyer_reply = _generate_buyer_reply(user_text)
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
