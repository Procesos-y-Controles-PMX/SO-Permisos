import { PERMISOS_USER_HEADER, readSessionActor } from "../session-actor";

function sessionHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  const actor = readSessionActor();
  if (actor) {
    headers[PERMISOS_USER_HEADER] = JSON.stringify(actor);
  }
  return headers;
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, {
      method: "GET",
      headers: sessionHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function apiSend<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: sessionHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await response.json()) as T & { message?: string; error?: string | null };
    if (!response.ok) {
      if (fallback && typeof fallback === "object" && fallback !== null && "error" in fallback) {
        return {
          ...(fallback as object),
          error: json.message ?? json.error ?? "Error de servidor.",
        } as T;
      }
      return fallback;
    }
    return json as T;
  } catch {
    return fallback;
  }
}

export async function apiSendForm<T>(path: string, form: FormData, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: sessionHeaders(false),
      body: form,
      cache: "no-store",
    });
    const json = (await response.json()) as T & { message?: string; error?: string | null };
    if (!response.ok) {
      if (fallback && typeof fallback === "object" && fallback !== null && "error" in fallback) {
        return {
          ...(fallback as object),
          error: json.message ?? json.error ?? "Error de servidor.",
        } as T;
      }
      return fallback;
    }
    return json as T;
  } catch {
    return fallback;
  }
}

export async function apiDownload(
  path: string,
): Promise<{ blob: Blob | null; error: string | null; filename: string | null }> {
  try {
    const response = await fetch(path, {
      method: "GET",
      headers: sessionHeaders(),
      cache: "no-store",
    });
    if (!response.ok) {
      let message = "No se pudo descargar el archivo.";
      try {
        const json = (await response.json()) as { message?: string; error?: string };
        message = json.message ?? json.error ?? message;
      } catch {
        /* ignore */
      }
      return { blob: null, error: message, filename: null };
    }
    const disposition = response.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="([^"]+)"/);
    return {
      blob: await response.blob(),
      error: null,
      filename: match?.[1] ?? null,
    };
  } catch {
    return { blob: null, error: "No se pudo descargar el archivo.", filename: null };
  }
}
