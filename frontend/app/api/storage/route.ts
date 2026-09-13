import { jsonError, jsonOk, requireApiSession } from "@/lib/api-route";
import {
  createSignedFileUrl,
  deleteStorageFile,
  downloadStorageBlob,
  getFileNameFromPath,
  promoteFile,
  uploadActiveFile,
  uploadSolicitudFile,
} from "@/lib/queries/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") ?? "";
    const op = searchParams.get("op") ?? "url";
    if (!path) return jsonError("Ruta de archivo requerida.", 400);

    if (op === "download") {
      const result = await downloadStorageBlob(path);
      if (result.error || !result.blob) {
        return jsonError(result.error || "No se pudo obtener el archivo.", 500);
      }
      const buffer = Buffer.from(await result.blob.arrayBuffer());
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": result.blob.type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${result.filename || getFileNameFromPath(path)}"`,
        },
      });
    }

    return jsonOk(await createSignedFileUrl(path));
  } catch (err) {
    console.error("[api/storage GET]", err);
    return jsonError("No se pudo obtener el archivo.");
  }
}

export async function POST(request: Request) {
  const session = requireApiSession(request);
  if (!session.ok) return session.response;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const op = String(form.get("op") || "");
      const file = form.get("file");
      const idTienda = Number(form.get("idTienda"));
      const nombrePermiso = String(form.get("nombrePermiso") || "Permiso");

      if (!(file instanceof File)) return jsonError("Archivo requerido.", 400);
      if (!Number.isFinite(idTienda)) return jsonError("Tienda inválida.", 400);

      if (op === "upload") return jsonOk(await uploadSolicitudFile(file, idTienda, nombrePermiso));
      if (op === "upload-active") return jsonOk(await uploadActiveFile(file, idTienda, nombrePermiso));
      return jsonError("Operación no válida.", 400);
    }

    const body = (await request.json()) as {
      op?: string;
      path?: string;
      idTienda?: number;
      nombrePermiso?: string;
    };

    if (body.op === "delete" && body.path) {
      return jsonOk(await deleteStorageFile(body.path));
    }
    if (body.op === "promote" && body.path && body.idTienda) {
      return jsonOk(await promoteFile(body.path, body.idTienda, body.nombrePermiso || "Permiso"));
    }
    if (body.op === "url" && body.path) {
      return jsonOk(await createSignedFileUrl(body.path));
    }

    return jsonError("Operación no válida.", 400);
  } catch (err) {
    console.error("[api/storage POST]", err);
    return jsonError("No se pudo completar la operación de storage.");
  }
}
