// ============================================================
// CMDB Icetel - Edge Function: admin-users
// Gestión de cuentas (listar, crear, modificar, eliminar, resetear
// contraseña). Usa el service_role (solo en el servidor) y exige que
// quien la invoca sea un usuario con rol 'admin' en cmdb_profiles.
//
// Deploy:  supabase functions deploy admin-users
// Requiere las variables (las pone Supabase por defecto):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  // 1) Verificar el token del usuario que llama
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Falta token de autorización" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "No autenticado" }, 401);

  // 2) Cliente admin (service_role) para comprobar rol y operar
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile } = await admin
    .from("cmdb_profiles")
    .select("role, active")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.active !== true) {
    return json({ error: "Requiere rol de administrador" }, 403);
  }

  // 3) Procesar la acción
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Cuerpo JSON inválido" }, 400);
  }
  const action = payload?.action as string;

  try {
    switch (action) {
      case "list": {
        const { data, error } = await admin
          .from("cmdb_profiles")
          .select("id, email, full_name, role, active, created_at")
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json({ users: data });
      }

      case "create": {
        const { email, password, full_name, role } = payload;
        if (!email || !password) return json({ error: "Email y contraseña son obligatorios" }, 400);
        if (String(password).length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);

        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name ?? email },
        });
        if (error) throw error;

        // El trigger crea el perfil; ajustamos rol/nombre.
        await admin.from("cmdb_profiles").upsert({
          id: created.user!.id,
          email,
          full_name: full_name ?? email,
          role: role ?? "viewer",
          active: true,
        });
        return json({ ok: true, id: created.user!.id });
      }

      case "update": {
        const { id, full_name, role, active, email } = payload;
        if (!id) return json({ error: "Falta id" }, 400);

        // Datos de Auth (email) si cambia
        if (email) {
          const { error } = await admin.auth.admin.updateUserById(id, { email });
          if (error) throw error;
        }
        const patch: Record<string, unknown> = {};
        if (full_name !== undefined) patch.full_name = full_name;
        if (role !== undefined) patch.role = role;
        if (active !== undefined) patch.active = active;
        if (email !== undefined) patch.email = email;
        if (Object.keys(patch).length) {
          const { error } = await admin.from("cmdb_profiles").update(patch).eq("id", id);
          if (error) throw error;
        }
        return json({ ok: true });
      }

      case "reset_password": {
        const { id, password } = payload;
        if (!id || !password) return json({ error: "Falta id o contraseña" }, 400);
        if (String(password).length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
        const { error } = await admin.auth.admin.updateUserById(id, { password });
        if (error) throw error;
        return json({ ok: true });
      }

      case "delete": {
        const { id } = payload;
        if (!id) return json({ error: "Falta id" }, 400);
        if (id === userData.user.id) return json({ error: "No puedes eliminar tu propia cuenta" }, 400);
        const { error } = await admin.auth.admin.deleteUser(id); // perfil se borra por cascade
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "Acción desconocida" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message ?? "Error interno" }, 500);
  }
});
