import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { bookingStore, useBooking } from "@/lib/booking";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Barbeiro {
  id: string;
  nome: string;
  foto_url: string | null;
  vagas: number; // -1 = fechado
  totalDia: number;
  limite: number;
}

export default function Barbeiros() {
  const nav = useNavigate();
  const booking = useBooking();
  const [list, setList] = useState<Barbeiro[] | null>(null);
  const today = new Date();
  const dataStr = today.toISOString().slice(0, 10);
  const dow = today.getDay();

  useEffect(() => {
    if (!booking.servicoId) { nav("/cliente/servicos"); return; }
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "barbeiro");
      const ids = (roles ?? []).map(r => r.user_id);
      if (ids.length === 0) { setList([]); return; }
      const [{ data: profs }, { data: limites }, { data: ags }] = await Promise.all([
        supabase.from("profiles").select("id,nome,foto_url").in("id", ids),
        supabase.from("limites_agenda").select("barbeiro_id,limite_clientes").in("barbeiro_id", ids).eq("dia_semana", dow),
        supabase.from("agendamentos").select("barbeiro_id").in("barbeiro_id", ids).eq("data", dataStr).neq("status", "cancelado"),
      ]);
      const limMap = new Map((limites ?? []).map(l => [l.barbeiro_id, l.limite_clientes]));
      const countMap = new Map<string, number>();
      (ags ?? []).forEach(a => countMap.set(a.barbeiro_id, (countMap.get(a.barbeiro_id) ?? 0) + 1));
      const result: Barbeiro[] = (profs ?? []).map(p => {
        const limite = limMap.get(p.id) ?? 0;
        const total = countMap.get(p.id) ?? 0;
        return {
          id: p.id, nome: p.nome, foto_url: p.foto_url,
          limite, totalDia: total,
          vagas: limite === 0 ? -1 : Math.max(0, limite - total),
        };
      }).sort((a, b) => a.nome.localeCompare(b.nome));
      setList(result);
    })();
  }, [booking.servicoId, dataStr, dow, nav]);

  const pick = (b: Barbeiro) => {
    if (b.vagas === -1) return toast.error("Barbeiro indisponível hoje");
    if (b.vagas === 0) return toast.error("Agenda lotada hoje");
    bookingStore.set({ barbeiroId: b.id, barbeiroNome: b.nome });
    nav("/cliente/data");
  };

  const preco = booking.servicoPreco ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-primary uppercase tracking-wider">2 de 4</p>
        <h1 className="font-display text-3xl">Barbeiros disponíveis</h1>
        <p className="text-muted-foreground text-sm">{booking.servicoNome} · {booking.servicoDuracao}min</p>
      </div>

      {!list && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>}
      {list?.length === 0 && <div className="card-elegant p-6 text-center text-muted-foreground">Nenhum barbeiro cadastrado.</div>}

      <div className="space-y-4">
        {list?.map(b => {
          const closed = b.vagas === -1;
          const full = b.vagas === 0;
          const disabled = closed || full;
          return (
            <div
              key={b.id}
              className={`card-elegant p-4 flex items-center gap-4 rounded-2xl ${disabled ? "opacity-60" : ""}`}
            >
              <Avatar className="w-16 h-16 border-2 border-primary/40">
                <AvatarImage src={b.foto_url ?? undefined} />
                <AvatarFallback className="bg-secondary text-primary font-display text-xl">
                  {b.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">{b.nome}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">5.0</span>
                </div>
                {closed ? (
                  <Badge variant="outline" className="mt-1 text-muted-foreground text-[10px]">Fechado hoje</Badge>
                ) : full ? (
                  <Badge className="mt-1 bg-destructive text-destructive-foreground text-[10px]">LOTADO</Badge>
                ) : (
                  <p className="text-[11px] text-primary font-medium mt-1">{b.vagas} vagas hoje</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-display text-xl text-primary">R${preco}</span>
                <button
                  onClick={() => pick(b)}
                  disabled={disabled}
                  className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg disabled:bg-muted disabled:text-muted-foreground"
                >
                  Agendar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
