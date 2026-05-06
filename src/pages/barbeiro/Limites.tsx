import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

interface Lim { dia_semana: number; limite_clientes: number; hora_inicio: string; hora_fim: string; }

export default function Limites() {
  const { user } = useAuth();
  const [items, setItems] = useState<Lim[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("limites_agenda").select("*").eq("barbeiro_id", user.id).then(({ data }) => {
      const map = new Map((data ?? []).map(l => [l.dia_semana, l]));
      setItems(dias.map((_, i) => ({
        dia_semana: i,
        limite_clientes: map.get(i)?.limite_clientes ?? 0,
        hora_inicio: (map.get(i)?.hora_inicio ?? "09:00").slice(0,5),
        hora_fim: (map.get(i)?.hora_fim ?? "19:00").slice(0,5),
      })));
    });
  }, [user]);

  const save = async () => {
    if (!user || !items) return;
    setSaving(true);
    const rows = items.map(it => ({ ...it, barbeiro_id: user.id }));
    const { error } = await supabase.from("limites_agenda")
      .upsert(rows, { onConflict: "barbeiro_id,dia_semana" });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Limites salvos!");
  };

  const update = (i: number, patch: Partial<Lim>) => {
    setItems(items!.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Agenda semanal</h1>
        <p className="text-muted-foreground text-sm">Limite de clientes por dia (0 = fechado)</p>
      </div>

      {!items && <div className="space-y-2">{Array.from({length:7}).map((_,i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>}

      <div className="space-y-3">
        {items?.map((it, i) => (
          <div key={i} className="card-elegant p-3 grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
            <p className="font-semibold text-sm">{dias[i]}</p>
            <Input type="time" value={it.hora_inicio} onChange={(e) => update(i, { hora_inicio: e.target.value })} className="w-24 h-9" />
            <Input type="time" value={it.hora_fim} onChange={(e) => update(i, { hora_fim: e.target.value })} className="w-24 h-9" />
            <Input type="number" min={0} value={it.limite_clientes} onChange={(e) => update(i, { limite_clientes: Number(e.target.value) })} className="w-16 h-9 text-center" />
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={saving} className="w-full bg-gradient-to-r from-primary to-[hsl(var(--gold-glow))] text-primary-foreground font-semibold h-12">
        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Salvar
      </Button>
    </div>
  );
}
