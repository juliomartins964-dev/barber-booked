// Edge function: manage barbeiros (create/delete) using service role.
// Only callers with role 'barbeiro' may perform actions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(url, service);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "barbeiro").maybeSingle();
    if (!roleRow) return json({ error: "Apenas barbeiros podem gerenciar a equipe" }, 403);

    const body = await req.json();
    const action = body.action as string;

    if (action === "create") {
      const nome = String(body.nome ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const telefone = body.telefone ? String(body.telefone) : null;
      if (nome.length < 2 || !email.includes("@") || password.length < 6) {
        return json({ error: "Dados inválidos" }, 400);
      }

      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { nome, telefone, tipo: "barbeiro" },
      });
      if (cErr) return json({ error: cErr.message }, 400);

      const uid = created.user!.id;
      // Trigger handle_new_user inserts profile + role; ensure role is 'barbeiro'.
      await admin.from("user_roles").upsert({ user_id: uid, role: "barbeiro" }, { onConflict: "user_id,role" });
      await admin.from("profiles").upsert({ id: uid, nome, telefone });
      return json({ ok: true, id: uid });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "id obrigatório" }, 400);
      if (id === user.id) return json({ error: "Você não pode excluir a si mesmo" }, 400);
      const { error: dErr } = await admin.auth.admin.deleteUser(id);
      if (dErr) return json({ error: dErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}
