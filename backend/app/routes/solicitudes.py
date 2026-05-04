from typing import Literal, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.notificacion_service import (
    procesar_solicitud_creada,
    procesar_solicitud_resuelta,
)

router = APIRouter()


class SolicitudCreadaPayload(BaseModel):
    id_solicitud: int = Field(..., gt=0)


class SolicitudResueltaPayload(BaseModel):
    id_solicitud: int = Field(..., gt=0)
    estatus: Literal["Aprobado", "Rechazado"]
    comentarios: Optional[str] = None


@router.post("/notificaciones/solicitud-creada")
async def notificar_solicitud_creada(payload: SolicitudCreadaPayload):
    resultado = procesar_solicitud_creada(payload.id_solicitud)
    return resultado


@router.post("/notificaciones/solicitud-resuelta")
async def notificar_solicitud_resuelta(payload: SolicitudResueltaPayload):
    resultado = procesar_solicitud_resuelta(
        id_solicitud=payload.id_solicitud,
        estatus=payload.estatus,
        comentarios=payload.comentarios,
    )
    return resultado