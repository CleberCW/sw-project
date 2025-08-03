from fastapi import APIRouter, UploadFile, Form
from fastapi.responses import JSONResponse

router = APIRouter(prefix='/wardrobe')
wardrobe_db = []

@router.post('/add')
async def add_piece(image: UploadFile, description: str = Form(...)):
    image_info = {'type': 'blusa', 'color': 'branca'}
    auto_desc = f"Essa peça parece uma {image_info['type']} {image_info['color']}"
    piece = {
        'filename': image.filename,
        'description': description or auto_desc,
        'type': image_info['type'],
        'color': image_info['color']
    }
    wardrobe_db.append(piece)
    return {'status': 'piece added', 'piece': piece}

@router.get('/list')
def list_pieces():
    return {'wardrobe': wardrobe_db}
