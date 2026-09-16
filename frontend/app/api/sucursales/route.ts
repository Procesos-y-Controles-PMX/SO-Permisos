import { jsonError, jsonOk, requireAdminSession } from "@/lib/api-route";
import {
  createRegion,
  createTienda,
  deleteRegion,
  deleteTienda,
  getPermisosAsignados,
  listSucursalesCatalog,
  updateRegion,
  updateTienda,
  type RegionWritePayload,
  type TiendaWritePayload,
} from "@/lib/queries/sucursales";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const idTienda = searchParams.get("permisosAsignados");
    if (idTienda) {
      return jsonOk(await getPermisosAsignados(Number(idTienda)));
    }
    return jsonOk(await listSucursalesCatalog());
  } catch (err) {
    console.error("[api/sucursales GET]", err);
    return jsonError("No se pudieron cargar las sucursales.");
  }
}

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (!session.ok) return session.response;

  try {
    const body = (await request.json()) as {
      op?: string;
      id?: number;
      region?: RegionWritePayload;
      tienda?: TiendaWritePayload;
      permisosSeleccionados?: number[];
    };

    if (body.op === "create-region" && body.region) {
      return jsonOk(await createRegion(body.region));
    }
    if (body.op === "update-region" && body.id && body.region) {
      return jsonOk(await updateRegion(body.id, body.region));
    }
    if (body.op === "delete-region" && body.id) {
      return jsonOk(await deleteRegion(body.id));
    }
    if (body.op === "create-tienda" && body.tienda && body.permisosSeleccionados) {
      return jsonOk(await createTienda(body.tienda, body.permisosSeleccionados));
    }
    if (body.op === "update-tienda" && body.id && body.tienda && body.permisosSeleccionados) {
      return jsonOk(await updateTienda(body.id, body.tienda, body.permisosSeleccionados));
    }
    if (body.op === "delete-tienda" && body.id) {
      return jsonOk(await deleteTienda(body.id));
    }

    return jsonError("Operación no válida.", 400);
  } catch (err) {
    console.error("[api/sucursales POST]", err);
    return jsonError("No se pudo completar la operación de sucursal.");
  }
}
