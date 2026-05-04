import os
from typing import Dict, List, Optional, Tuple

from supabase import Client, create_client

from app.services.gmail_service import enviar_correo, enviar_correo_multiple

_supabase_client: Optional[Client] = None


def _get_supabase_client() -> Optional[Client]:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None

    _supabase_client = create_client(url, key)
    return _supabase_client


def _get_admin_emails() -> List[str]:
    raw = os.getenv("ADMIN_NOTIFICATION_EMAILS", "")
    return [email.strip() for email in raw.split(",") if email.strip()]


def _fetch_solicitud(id_solicitud: int) -> Tuple[Optional[Dict], Optional[str]]:
    supabase = _get_supabase_client()
    if not supabase:
        return None, "Cliente de Supabase no inicializado."

    try:
        response = (
            supabase.table("solicitudes")
            .select(
                """
                id,
                id_tienda,
                id_tipo_permiso,
                estatus_solicitud,
                fecha_solicitud,
                vigencia_propuesta,
                comentarios_admin,
                tienda:id_tienda(id,sucursal,correo),
                tipo_permiso:id_tipo_permiso(id,nombre_permiso)
                """
            )
            .eq("id", id_solicitud)
            .single()
            .execute()
        )
        return response.data, None
    except Exception as exc:
        return None, str(exc)


def _count_pendientes_tienda(id_tienda: int) -> Tuple[Optional[int], Optional[str]]:
    supabase = _get_supabase_client()
    if not supabase:
        return None, "Cliente de Supabase no inicializado."

    try:
        response = (
            supabase.table("solicitudes")
            .select("id", count="exact")
            .eq("id_tienda", id_tienda)
            .eq("estatus_solicitud", "Pendiente")
            .execute()
        )
        return response.count or 0, None
    except Exception as exc:
        return None, str(exc)


def procesar_solicitud_creada(id_solicitud: int) -> Dict:
    solicitud, solicitud_error = _fetch_solicitud(id_solicitud)
    if solicitud_error:
        return {"ok": False, "sent": False, "reason": f"Error leyendo solicitud: {solicitud_error}"}
    if not solicitud:
        return {"ok": False, "sent": False, "reason": "Solicitud no encontrada."}

    pendientes, pendientes_error = _count_pendientes_tienda(solicitud["id_tienda"])
    if pendientes_error:
        return {"ok": False, "sent": False, "reason": f"Error contando pendientes: {pendientes_error}"}

    if pendientes != 1:
        return {
            "ok": True,
            "sent": False,
            "reason": "No se envia correo admin porque la tienda ya tiene pendientes abiertos.",
            "pending_count": pendientes,
        }

    admin_emails = _get_admin_emails()
    if not admin_emails:
        return {"ok": False, "sent": False, "reason": "ADMIN_NOTIFICATION_EMAILS no esta configurado."}

    tienda = solicitud.get("tienda") or {}
    tipo_permiso = solicitud.get("tipo_permiso") or {}
    asunto = f"Nueva solicitud de revision - {tienda.get('sucursal', 'Tienda')} - {tipo_permiso.get('nombre_permiso', 'Permiso')}"
    cuerpo = (
        "Se recibio una nueva solicitud de revision de permiso.\n\n"
        f"Tienda: {tienda.get('sucursal', 'N/A')}\n"
        f"Correo tienda: {tienda.get('correo', 'N/A')}\n"
        f"Permiso: {tipo_permiso.get('nombre_permiso', 'N/A')}\n"
        f"Fecha solicitud: {solicitud.get('fecha_solicitud', 'N/A')}\n"
        f"Vigencia propuesta: {solicitud.get('vigencia_propuesta', 'N/A')}\n"
        f"ID solicitud: {solicitud.get('id', 'N/A')}\n"
    )

    sent, error_msg = enviar_correo_multiple(admin_emails, asunto, cuerpo)
    return {
        "ok": sent,
        "sent": sent,
        "reason": error_msg if error_msg else "Correo a admin enviado correctamente.",
        "pending_count": pendientes,
    }


def procesar_solicitud_resuelta(id_solicitud: int, estatus: str, comentarios: Optional[str] = None) -> Dict:
    solicitud, solicitud_error = _fetch_solicitud(id_solicitud)
    if solicitud_error:
        return {"ok": False, "sent": False, "reason": f"Error leyendo solicitud: {solicitud_error}"}
    if not solicitud:
        return {"ok": False, "sent": False, "reason": "Solicitud no encontrada."}

    tienda = solicitud.get("tienda") or {}
    tipo_permiso = solicitud.get("tipo_permiso") or {}
    correo_tienda = tienda.get("correo")
    if not correo_tienda:
        return {"ok": False, "sent": False, "reason": "La tienda no tiene correo configurado."}

    asunto = f"Resultado de revision de permiso - {tipo_permiso.get('nombre_permiso', 'Permiso')}"
    cuerpo = (
        "Tu solicitud fue revisada por administracion.\n\n"
        f"Tienda: {tienda.get('sucursal', 'N/A')}\n"
        f"Permiso: {tipo_permiso.get('nombre_permiso', 'N/A')}\n"
        f"Estatus: {estatus}\n"
        f"Comentario admin: {comentarios or solicitud.get('comentarios_admin') or 'Sin comentarios'}\n"
        f"ID solicitud: {solicitud.get('id', 'N/A')}\n"
    )

    sent = enviar_correo(correo_tienda, asunto, cuerpo)
    return {
        "ok": sent,
        "sent": sent,
        "reason": None if sent else "No fue posible enviar correo a la tienda.",
    }
