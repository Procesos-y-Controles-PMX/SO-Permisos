from fastapi import APIRouter
from app.services.gmail_service import enviar_correo

router = APIRouter()

@router.post("/notificar")
async def notificar_tienda(email: str, estatus: str):
    asunto = f"Actualización de Solicitud - {estatus}"
    cuerpo = f"Tu solicitud ha sido cambiada a: {estatus}."
    
    exito = enviar_correo(email, asunto, cuerpo)
    return {"enviado": exito}