import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Play, X, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-muted text-muted-foreground" },
  confirmado: { label: "Confirmado", cls: "bg-info text-info-foreground" },
  em_andamento: { label: "Em andamento", cls: "bg-warning text-warning-foreground" },
  concluido: { label: "Concluído", cls: "bg-success text-success-foreground" },
  cancelado: { label: "Cancelado", cls: "bg-destructive text-destructive-foreground" },
};

interface Item { id: string; hora: string; status: string; cliente: string; servico: string; }

export default function Atendimentos() {
  const { user } = useAuth();
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [list, setList] = useState<Item[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setList(null);
    const { data: ags } = await supabase.from("agendamentos")
      .select("id,hora,status,cliente_id,servico_id")
      .eq("barbeiro_id", user.id).eq("data", data).order("hora");
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
      cliente: cMap.get(a.cliente_id) ?? "—", servico: sMap.get(a.servico_id) ?? "—",
    })));
  }, [user, data]);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("agendamentos").update({ status: status as any }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Status atualizado");
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Atendimentos</h1>
        <p className="text-muted-foreground text-sm">Gerencie status do dia</p>
      </div>

      <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />

      {!list && <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>}
      {list?.length === 0 && <div className="card-elegant p-6 text-center text-muted-foreground">Nada para esse dia.</div>}

      <div className="space-y-3">
        {list?.map(a => (
          <div key={a.id} className="card-elegant p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{a.hora} · {a.cliente}</p>
                <p className="text-xs text-muted-foreground">{a.servico}</p>
              </div>
              <Badge className={statusMap[a.status]?.cls}>{statusMap[a.status]?.label}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <ActionBtn icon={Check} onClick={() => update(a.id, "confirmado")} />
              <ActionBtn icon={Play} onClick={() => update(a.id, "em_andamento")} />
              <ActionBtn icon={CheckCheck} onClick={() => update(a.id, "concluido")} />
              <ActionBtn icon={X} variant="destructive" onClick={() => update(a.id, "cancelado")} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ActionBtn = ({ icon: Icon, onClick, variant }: { icon: any; onClick: () => void; variant?: "destructive" }) => (
  <Button
    size="sm"
    variant="outline"
    onClick={onClick}
    className={variant === "destructive" ? "border-destructive/30 text-destructive hover:bg-destructive/10" : ""}
  >
    <Icon className="w-4 h-4" />
  </Button>
);
