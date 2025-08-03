

from fastapi import FastAPI, UploadFile, Form, Request
from fastapi.responses import JSONResponse, Response
from typing import List
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# Simulação de armazenamento em memória
wardrobe_db = []
feedback_db = []


@app.get('/')
def root():
    return {'message': 'Assistente de Estilo WhatsApp - MVP'}

# Cadastro de roupa
@app.post('/wardrobe/add')
async def add_piece(image: UploadFile, description: str = Form(...)):
    # Simula processamento de imagem e descrição automática
    image_info = {'type': 'blusa', 'color': 'branca'}  # Simulação
    auto_desc = f"Essa peça parece uma {image_info['type']} {image_info['color']}"
    piece = {
        'filename': image.filename,
        'description': description or auto_desc,
        'type': image_info['type'],
        'color': image_info['color']
    }
    wardrobe_db.append(piece)
    return {'status': 'piece added', 'piece': piece}

# Listar roupas cadastradas
@app.get('/wardrobe/list')
def list_pieces():
    return {'wardrobe': wardrobe_db}

# Sugestão de look
@app.post('/suggest/look')
async def suggest_look(event: str = Form(...), location: str = Form(...)):
    # Simula consulta de clima
    climate = 'frio' if 'noite' in event else 'quente'
    # Simula sugestão de look
    if not wardrobe_db:
        return JSONResponse({'error': 'Nenhuma peça cadastrada'}, status_code=400)
    look = wardrobe_db[:2] if len(wardrobe_db) >= 2 else wardrobe_db
    suggestion = f"Para {event} com clima {climate}, sugerimos: " + ', '.join([p['description'] for p in look])
    return {'suggestion': suggestion, 'pieces': look}

# Feedback
@app.post('/feedback')
async def feedback(liked: bool = Form(...), event: str = Form(...)):
    feedback_db.append({'liked': liked, 'event': event})
    return {'status': 'feedback received', 'feedback': feedback_db[-1]}


# Webhook para Z-API WhatsApp
import os
import requests

@app.post('/whatsapp/webhook')
async def whatsapp_webhook(request: Request):
    data = await request.json()
    mensagem = data.get('message', '').lower()
    numero = data.get('phone', '')

    # Lógica simples de resposta
    if 'jantar' in mensagem:
        resposta = "Qual o clima na sua cidade? Envie 'frio' ou 'quente'."
    elif 'frio' in mensagem or 'quente' in mensagem:
        clima = 'frio' if 'frio' in mensagem else 'quente'
        if not wardrobe_db:
            resposta = "Nenhuma peça cadastrada. Envie uma foto para começar!"
        else:
            look = wardrobe_db[:2] if len(wardrobe_db) >= 2 else wardrobe_db
            sugestao = ', '.join([p['description'] for p in look])
            resposta = f"Sugestão para clima {clima}: {sugestao}"
    elif 'foto' in mensagem or 'imagem' in mensagem:
        resposta = "Envie a foto como anexo para cadastrar a peça."
    else:
        resposta = "Olá! Sou seu assistente de estilo. Envie uma foto para cadastrar uma peça ou descreva o evento."
 
    # Envia resposta via Z-API

    zapi_token = os.getenv('ZAPI_TOKEN')
    if not zapi_token:
        return {"error": "ZAPI_TOKEN não configurado no .env"}
    zapi_url = f"https://api.z-api.io/instances/{zapi_token}/token/{zapi_token}/send-text"
    payload = {
        "phone": numero,
        "message": resposta
    }
    requests.post(zapi_url, json=payload)

    # Se quiser enviar imagens das peças cadastradas:
    # for p in look:
    #     if 'image_url' in p:
    #         img_payload = {"phone": numero, "image": p['image_url'], "caption": p['description']}
    #         requests.post(f"https://api.z-api.io/instances/YOUR_INSTANCE_TOKEN/token/{zapi_token}/send-image", json=img_payload)

    return {"status": "Mensagem enviada via Z-API"}
