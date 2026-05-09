import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { bookingStore, useBooking } from "@/lib/booking";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parse, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

function buildSlots(start: string, end: string, dur: number): string[] {
  const out: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = sh * 60 + sm;
  const stop = eh * 60 + em;
  while (cur + dur <= stop) {
    out.push(`${String(Math.floor(cur/60)).padStart(2,"0")}:${String(cur%60).padStart(2,"0")}`);
    cur += dur;
  }
  return out;
}

export default function HorarioSelect() {
  const nav = useNavigate();
  const b = useBooking();
  const [slots, setSlots] = useState<string[] | null>(null);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [limiteCheio, setLimiteCheio] = useState(false);

  const dataObj = useMemo(() => b.data ? parse(b.data, "yyyy-MM-dd", new Date()) : null, [b.data]);

  useEffect(() => {
    if (!b.barbeiroId || !b.data || !b.servicoDuracao) { nav("/cliente/servicos"); return; }
    const dow = parse(b.data, "yyyy-MM-dd", new Date()).getDay();
    (async () => {
      const [{ data: lim }, { data: ags }] = await Promise.all([
        supabase.from("limites_agenda").select("*").eq("barbeiro_id", b.barbeiroId!).eq("dia_semana", dow).maybeSingle(),
        supabase.from("agendamentos").select("hora,status").eq("barbeiro_id", b.barbeiroId!).eq("data", b.data!).neq("status","cancelado"),
      ]);
      if (!lim || lim.limite_clientes === 0) { setSlots([]); return; }
      if ((ags?.length ?? 0) >= lim.limite_clientes) setLimiteCheio(true);
      setOcupados(new Set((ags ?? []).map(a => a.hora.slice(0,5))));
      setSlots(buildSlots(lim.hora_inicio.slice(0,5), lim.hora_fim.slice(0,5), b.servicoDuracao!));
    })();
  }, [b.barbeiroId, b.data, b.servicoDuracao, nav]);

  const pick = (h: string) => {
    bookingStore.set({ hora: h });
    nav("/cliente/confirmacao");
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-primary uppercase tracking-wider">4 de 4</p>
        <h1 className="font-display text-3xl">Escolha o horário</h1>
        <p className="text-muted-foreground text-sm">
          {dataObj && format(dataObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {!slots && <div className="grid grid-cols-3 gap-2">{Array.from({length:9}).map((_,i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>}

      {limiteCheio && (
        <div className="card-elegant p-4 border-destructive bg-destructive/10 text-center">
          <p className="text-destructive font-semibold">LOTADO</p>
          <p className="text-sm text-muted-foreground">Limite diário atingido. Tente outra data.</p>
        </div>
      )}

      {slots && !limiteCheio && (
        <div className="grid grid-cols-3 gap-2">
          {slots.filter(s => !ocupados.has(s)).map(s => (
            <button
              key={s}
              onClick={() => pick(s)}
              className="py-3 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/10 transition font-semibold"
            >
              {s}
            </button>
          ))}
          {slots.filter(s => !ocupados.has(s)).length === 0 && (
            <p className="col-span-3 text-center text-muted-foreground py-8">Sem horários disponíveis.</p>
          )}
        </div>
      )}
    </div>
  );
}
