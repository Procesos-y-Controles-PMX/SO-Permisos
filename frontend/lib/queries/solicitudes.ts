import "server-only";

import { createSupabaseServerClient } from "../supabase-server";
import type { SessionActor } from "../session-actor";
import { isExpiredDate } from "./helpers";
import { deleteStorageFile, promoteFile } from "./storage";
import { upsertPermisoVigente } from "./permisos";

const SOLICITUD_SELECT = `
  *,
  tienda:id_tienda(id, sucursal),
  tipo_permiso:id_tipo_permiso(id, nombre_permiso)
`;

const PENDIENTES_SELECT = `
  id,
  id_tienda,
  id_tipo_permiso,
  fecha_solicitud,
  estatus_solicitud,
  tienda:id_tienda(id, sucursal, gerente_tienda, region:id_region(nombre_region)),
  tipo_permiso:id_tipo_permiso(nombre_permiso)
`;

async function notifyBackend(path: string, body: Record<string, unknown>) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) return;
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.warn(`[solicitudes] Notificacion backend fallo (${path}):`, await response.text());
    }
  } catch (error) {
    console.warn(`[solicitudes] Error enviando notificacion (${path}):`, error);
  }
}

export async function listSolicitudes(actor: SessionActor, idTienda?: number) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("solicitudes")
    .select(SOLICITUD_SELECT)
    .order("fecha_solicitud", { ascending: false });

  if (idTienda) {
    query = query.eq("id_tienda", idTienda);
  } else if (actor.rol === "Tienda" && actor.id_tienda) {
    query = query.eq("id_tienda", actor.id_tienda);
  } else if (actor.rol === "Regional" && actor.id_region) {
    const { data: tiendasRegion } = await supabase
      .from("tiendas")
      .select("id")
      .eq("id_region", actor.id_region);

    if (tiendasRegion && tiendasRegion.length > 0) {
      query = query.in(
        "id_tienda",
        tiendasRegion.map((t) => t.id),
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listSolicitudesPendientes() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("solicitudes")
    .select(PENDIENTES_SELECT)
    .eq("estatus_solicitud", "Pendiente")
    .order("fecha_solicitud", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createSolicitud(payload: {
  id_tienda: number;
  id_tipo_permiso: number;
  vigencia_propuesta: string | null;
  archivo_adjunto_path: string | null;
}): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  if (payload.vigencia_propuesta && isExpiredDate(payload.vigencia_propuesta)) {
    return { error: "La vigencia propuesta no puede ser anterior al día de hoy." };
  }

  const { data: nuevaSolicitud, error: err } = await supabase
    .from("solicitudes")
    .insert({
      ...payload,
      estatus_solicitud: "Pendiente",
    })
    .select("id")
    .single();

  if (err) return { error: err.message };

  const vigenteErr = await upsertPermisoVigente({
    id_tienda: payload.id_tienda,
    id_tipo_permiso: payload.id_tipo_permiso,
    fecha_vencimiento: payload.vigencia_propuesta,
    estatus: "Pendiente",
    archivo_path: null,
  });
  if (vigenteErr.error) return vigenteErr;

  if (nuevaSolicitud?.id) {
    await notifyBackend("/api/v1/notificaciones/solicitud-creada", {
      id_solicitud: nuevaSolicitud.id,
    });
  }

  return { error: null };
}

export async function aprobarSolicitud(
  id: number,
  comentarios: string | undefined,
  adminId: number | null,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: updatedSolicitud, error: err } = await supabase
    .from("solicitudes")
    .update({
      estatus_solicitud: "Aprobado",
      comentarios_admin: comentarios || null,
      id_admin_revisor: adminId,
    })
    .eq("id", id)
    .select(`
      *,
      tipo_permiso:id_tipo_permiso(nombre_permiso)
    `)
    .single();

  if (err) return { error: err.message };
  if (!updatedSolicitud) return { error: "No se encontró la solicitud aprobada." };

  const tipoPermiso = Array.isArray(updatedSolicitud.tipo_permiso)
    ? updatedSolicitud.tipo_permiso[0]
    : updatedSolicitud.tipo_permiso;

  const { data: configCheck, error: configErr } = await supabase
    .from("configuracion_tienda_permisos")
    .select("id")
    .eq("id_tienda", updatedSolicitud.id_tienda)
    .eq("id_tipo_permiso", updatedSolicitud.id_tipo_permiso)
    .single();

  if (configErr || !configCheck) {
    return { error: "El permiso no está configurado para esta tienda (FK check failed)." };
  }

  let finalPath = updatedSolicitud.archivo_adjunto_path as string | null;
  const expiredAtApproval = isExpiredDate(updatedSolicitud.vigencia_propuesta);

  if (finalPath && finalPath.startsWith("solicitudes/")) {
    const { newPath, error: moveErr } = await promoteFile(
      finalPath,
      updatedSolicitud.id_tienda,
      tipoPermiso?.nombre_permiso || "Permiso",
    );
    if (moveErr) return { error: `Error al mover archivo: ${moveErr}` };
    finalPath = newPath;
    await supabase.from("solicitudes").update({ archivo_adjunto_path: finalPath }).eq("id", updatedSolicitud.id);
  }

  if (expiredAtApproval && finalPath) {
    const { error: deleteErr } = await deleteStorageFile(finalPath);
    if (deleteErr) {
      console.warn("[solicitudes] No se pudo eliminar archivo vencido tras aprobación:", deleteErr);
    }
    finalPath = null;
    await supabase.from("solicitudes").update({ archivo_adjunto_path: null }).eq("id", updatedSolicitud.id);
  }

  const vigenteErr = await upsertPermisoVigente({
    id_tienda: updatedSolicitud.id_tienda,
    id_tipo_permiso: updatedSolicitud.id_tipo_permiso,
    fecha_vencimiento: updatedSolicitud.vigencia_propuesta,
    estatus: expiredAtApproval ? "Vencido" : "Activo",
    archivo_path: finalPath,
    puntaje: 1,
  });
  if (vigenteErr.error) return vigenteErr;

  await notifyBackend("/api/v1/notificaciones/solicitud-resuelta", {
    id_solicitud: id,
    estatus: "Aprobado",
    comentarios: comentarios || null,
  });

  return { error: null };
}

export async function rechazarSolicitud(
  id: number,
  comentarios: string,
  adminId: number | null,
): Promise<{ error: string | null }> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { error: "Servidor sin configuración de base de datos." };

  const { data: solicitud, error: getErr } = await supabase
    .from("solicitudes")
    .select("id_tienda, id_tipo_permiso")
    .eq("id", id)
    .single();

  if (getErr) return { error: getErr.message };

  const { error: err } = await supabase
    .from("solicitudes")
    .update({
      estatus_solicitud: "Rechazado",
      comentarios_admin: comentarios,
      id_admin_revisor: adminId,
    })
    .eq("id", id);

  if (err) return { error: err.message };

  const vigenteErr = await upsertPermisoVigente({
    id_tienda: solicitud.id_tienda,
    id_tipo_permiso: solicitud.id_tipo_permiso,
    estatus: "Vencido",
    archivo_path: null,
  });
  if (vigenteErr.error) return vigenteErr;

  await notifyBackend("/api/v1/notificaciones/solicitud-resuelta", {
    id_solicitud: id,
    estatus: "Rechazado",
    comentarios,
  });

  return { error: null };
}
