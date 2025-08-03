from fastapi import APIRouter, Request, Form

router = APIRouter(prefix='/whatsapp')
feedback_db = []

@router.post('/webhook')
async def whatsapp_webhook(request: Request):
    data = await request.json()
    return {'status': 'received', 'data': data}

@router.post('/feedback')
async def feedback(liked: bool = Form(...), event: str = Form(...)):
    feedback_db.append({'liked': liked, 'event': event})
    return {'status': 'feedback received', 'feedback': feedback_db[-1]}
