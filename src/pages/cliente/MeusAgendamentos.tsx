import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, RefreshCw, X } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Ag {
  id: string; data: string; hora: string; status: string;
  servicos: { nome: string; preco: number } | null;
  barbeiro: { nome: string } | null;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-muted text-muted-foreground" },
  confirmado: { label: "Confirmado", cls: "bg-info text-info-foreground" },
  em_andamento: { label: "Em andamento", cls: "bg-warning text-warning-foreground" },
  concluido: { label: "Concluído", cls: "bg-success text-success-foreground" },
  cancelado: { label: "Cancelado", cls: "bg-destructive text-destructive-foreground" },
};

export default function MeusAgendamentos() {
  const { user } = useAuth();
  const [list, setList] = useState<Ag[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: ags } = await supabase
      .from("agendamentos")
      .select("id,data,hora,status,servico_id,barbeiro_id")
      .eq("cliente_id", user.id)
      .order("data", { ascending: false })
      .order("hora", { ascending: false });
    if (!ags) { setList([]); return; }
    const sIds = [...new Set(ags.map(a => a.servico_id))];
    const bIds = [...new Set(ags.map(a => a.barbeiro_id))];
    const [{ data: servs }, { data: profs }] = await Promise.all([
      supabase.from("servicos").select("id,nome,preco").in("id", sIds),
      supabase.from("profiles").select("id,nome").in("id", bIds),
    ]);
    const sMap = new Map((servs ?? []).map(s => [s.id, s]));
    const bMap = new Map((profs ?? []).map(p => [p.id, p]));
    setList(ags.map(a => ({
      id: a.id, data: a.data, hora: a.hora, status: a.status,
      servicos: sMap.get(a.servico_id) ? { nome: sMap.get(a.servico_id)!.nome, preco: Number(sMap.get(a.servico_id)!.preco) } : null,
      barbeiro: bMap.get(a.barbeiro_id) ? { nome: bMap.get(a.barbeiro_id)!.nome } : null,
    })));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", id);
    if (error) return toast.error("Erro ao cancelar");
    toast.success("Agendamento cancelado");
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Meus agendamentos</h1>
          <p className="text-muted-foreground text-sm">Histórico e próximos</p>
        </div>
        <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {!list && <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>}
      {list?.length === 0 && (
        <div className="card-elegant p-6 text-center text-muted-foreground">
          Nenhum agendamento ainda.
        </div>
      )}

      <div className="space-y-3">
        {list?.map(a => {
          const dt = parse(`${a.data} ${a.hora}`, "yyyy-MM-dd HH:mm:ss", new Date());
          const future = dt > new Date() && a.status !== "cancelado" && a.status !== "concluido";
          return (
            <div key={a.id} className="card-elegant p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{a.servicos?.nome ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">com {a.barbeiro?.nome ?? "—"}</p>
                </div>
                <Badge className={statusMap[a.status]?.cls}>{statusMap[a.status]?.label}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(dt, "dd/MM/yyyy", { locale: ptBR })}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.hora.slice(0,5)}</span>
                <span className="ml-auto text-primary font-semibold">R$ {a.servicos?.preco.toFixed(2)}</span>
              </div>
              {future && (
                <Button variant="outline" size="sm" onClick={() => cancel(a.id)} className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
