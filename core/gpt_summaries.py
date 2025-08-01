import os
import pathlib
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables safely
env_path = pathlib.Path(__file__).parent.parent / ".env"
if not env_path.exists():
    env_path = pathlib.Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError(f"❌ OPENAI_API_KEY not found in .env at {env_path}")

client = OpenAI(api_key=OPENAI_API_KEY)

def generate_issue_summary(complaints, make, model, year):
    if not complaints:
        return f"Issue affecting {year} {make} {model}"
    prompt = f"""
    Create a concise, professional issue title for {year} {make} {model}
    based on these complaints. Be specific and relevant to a repair shop owner.

    Complaints:
    {complaints[:10]}
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=60,
        temperature=0.6,
    )
    return response.choices[0].message.content.strip()

def generate_smart_vehicle_summary(make, model, year, complaints):
    if not complaints:
        return "No additional complaint context available."
    prompt = f"""
    Summarize key systemic insights for a repair shop owner about {year} {make} {model}.
    Highlight recurring complaint themes, potential business impact, and urgency.

    Complaints:
    {complaints[:15]}
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()

def generate_corrective_action(make, model, year, complaints):
    if not complaints:
        return "No corrective actions available."
    prompt = f"""
    Provide a detailed corrective action plan for technicians
    working on {year} {make} {model}. Address root causes from these complaints
    and explain how to reduce comebacks and improve efficiency.

    Complaints:
    {complaints[:15]}
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.65,
    )
    return response.choices[0].message.content.strip()
