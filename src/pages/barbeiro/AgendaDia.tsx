import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusMap: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-muted text-muted-foreground" },
  confirmado: { label: "Confirmado", cls: "bg-info text-info-foreground" },
  em_andamento: { label: "Em andamento", cls: "bg-warning text-warning-foreground" },
  concluido: { label: "Concluído", cls: "bg-success text-success-foreground" },
  cancelado: { label: "Cancelado", cls: "bg-destructive text-destructive-foreground" },
};

interface Item { id: string; hora: string; status: string; cliente: string; servico: string; }

export default function AgendaDia() {
  const { user } = useAuth();
  const [list, setList] = useState<Item[] | null>(null);
  const today = new Date();

  const load = useCallback(async () => {
    if (!user) return;
    const { data: ags } = await supabase.from("agendamentos")
      .select("id,hora,status,cliente_id,servico_id")
      .eq("barbeiro_id", user.id)
      .eq("data", format(today, "yyyy-MM-dd"))
      .order("hora");
    if (!ags) { setList([]); return; }
    const cIds = [...new Set(ags.map(a => a.cliente_id))];
    const sIds = [...new Set(ags.map(a => a.servico_id))];
    const [{ data: profs }, { data: servs }] = await Promise.all([
      supabase.from("profiles").select("id,nome").in("id", cIds),
      supabase.from("servicos").select("id,nome").in("id", sIds),
    ]);
    const cMap = new Map((profs ?? []).map(p => [p.id, p.nome]));
    const sMap = new Map((servs ?? []).map(s => [s.id, s.nome]));
    setList(ags.map(a => ({
      id: a.id, hora: a.hora.slice(0,5), status: a.status,
      cliente: cMap.get(a.cliente_id) ?? "—",
      servico: sMap.get(a.servico_id) ?? "—",
    })));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-primary uppercase tracking-wider">{format(today, "EEEE", { locale: ptBR })}</p>
          <h1 className="font-display text-3xl">{format(today, "dd 'de' MMMM", { locale: ptBR })}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {!list && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>}
      {list?.length === 0 && (
        <div className="card-elegant p-6 text-center text-muted-foreground">Nenhum atendimento hoje.</div>
      )}

      <div className="space-y-3">
        {list?.map(a => (
          <div key={a.id} className="card-elegant p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 grid place-items-center">
              <Clock className="w-4 h-4 text-primary" />
              <span className="absolute font-display text-base text-primary mt-7">{a.hora}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold">{a.cliente}</p>
              <p className="text-xs text-muted-foreground">{a.servico}</p>
              <Badge className={`${statusMap[a.status]?.cls} mt-1.5`}>{statusMap[a.status]?.label}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
