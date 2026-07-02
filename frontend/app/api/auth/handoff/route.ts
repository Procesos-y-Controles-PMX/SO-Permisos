import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { Perfil, RolUsuario } from "@/types";

/**
 * Verifies a short-lived handoff token issued by SO-Portal and returns the
 * perfil/rol payload so the client can establish its normal session.
 */
export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string };
    if (!token) {
      return NextResponse.json({ ok: false, message: "Token requerido." }, { status: 400 });
    }

    const secret = (process.env.PORTAL_HANDOFF_SECRET ?? "").trim();
    if (!secret) {
      return NextResponse.json(
        { ok: false, message: "Handoff no configurado en el servidor." },
        { status: 500 },
      );
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: "so-portal",
    });

    if (payload.app !== "permisos") {
      return NextResponse.json({ ok: false, message: "Token de otra aplicación." }, { status: 401 });
    }

    const session = payload.session as { perfil?: Perfil; rol?: RolUsuario | null } | undefined;
    if (!session?.perfil?.id || !session.perfil.email) {
      return NextResponse.json({ ok: false, message: "Token inválido." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, perfil: session.perfil, rol: session.rol ?? null });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Token inválido o expirado. Inicia sesión de nuevo." },
      { status: 401 },
    );
  }
}
