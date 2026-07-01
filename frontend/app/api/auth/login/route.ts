import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Perfil, RolUsuario } from "@/types";

const PERFIL_SELECT =
  "id, email, nombre_completo, id_rol, id_tienda, id_region, created_at, roles:id_rol(id, nombre_rol)";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(body.email ?? "");
    const password = (body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Credenciales requeridas." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, message: "Servidor sin configuración de base de datos." },
        { status: 500 },
      );
    }

    const { data: candidates, error } = await supabase
      .from("perfiles")
      .select(`${PERFIL_SELECT}, password`)
      .ilike("email", email);

    if (error) {
      console.error("Login query error:", error.message);
      return NextResponse.json(
        { ok: false, message: "Credenciales incorrectas. Verifica tu correo y contraseña." },
        { status: 401 },
      );
    }

    const data = (candidates ?? []).find(
      (row) => String(row.password ?? "").trim() === password,
    );

    if (!data) {
      return NextResponse.json(
        { ok: false, message: "Credenciales incorrectas. Verifica tu correo y contraseña." },
        { status: 401 },
      );
    }

    const rolData = data.roles as { id: number; nombre_rol: RolUsuario } | null;
    const perfil: Perfil = {
      id: data.id,
      email: data.email,
      nombre_completo: data.nombre_completo,
      id_rol: data.id_rol,
      id_tienda: data.id_tienda,
      id_region: data.id_region,
      created_at: data.created_at,
    };

    return NextResponse.json({
      ok: true,
      perfil,
      rol: rolData?.nombre_rol ?? null,
    });
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { ok: false, message: "Error al iniciar sesión." },
      { status: 500 },
    );
  }
}
