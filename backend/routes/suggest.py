import os
import requests
from fastapi import APIRouter, Form
from fastapi.responses import JSONResponse
from backend.database.memory import wardrobe_db

router = APIRouter(prefix='/suggest')

def get_look_suggestion_llm(event, climate, wardrobe):
    prompt = f"Sugira um look do dia para o evento '{event}' com clima '{climate}', considerando estas peças: "
    prompt += ', '.join([p['description'] for p in wardrobe])
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return "[ERRO] OPENAI_API_KEY não configurada."
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}]
        }
    )
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"[ERRO] OpenAI: {response.text}"

@router.post('/look')
async def suggest_look(event: str = Form(...), location: str = Form(...)):
    climate = 'frio' if 'noite' in event else 'quente'
    if not wardrobe_db:
        return JSONResponse({'error': 'Nenhuma peça cadastrada'}, status_code=400)
    look = wardrobe_db[:2] if len(wardrobe_db) >= 2 else wardrobe_db
    suggestion = get_look_suggestion_llm(event, climate, look)
    return {'suggestion': suggestion, 'pieces': look}
