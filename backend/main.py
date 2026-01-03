from fastapi import FastAPI
from pydantic import BaseModel
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

class Conversation(BaseModel):
    user_text: str

@app.post("/simulate")
def simulate_buyer(data: Conversation):
    prompt = f"""
You are a real estate buyer persona.
React naturally, raise objections, negotiate.

Salesperson says:
{data.user_text}
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a realistic buyer."},
            {"role": "user", "content": prompt}
        ]
    )

    buyer_reply = response.choices[0].message.content

    feedback_prompt = f"""
Analyze this sales response and give feedback:
{data.user_text}
"""

    feedback = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a sales coach."},
            {"role": "user", "content": feedback_prompt}
        ]
    )

    return {
        "buyer_reply": buyer_reply,
        "feedback": feedback.choices[0].message.content
    }
