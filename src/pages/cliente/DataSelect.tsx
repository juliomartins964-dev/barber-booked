import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { bookingStore, useBooking } from "@/lib/booking";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DataSelect() {
  const nav = useNavigate();
  const booking = useBooking();
  const [date, setDate] = useState<Date | undefined>();
  const [diasFechados, setDiasFechados] = useState<number[]>([]);

  useEffect(() => {
    if (!booking.barbeiroId) { nav("/cliente/barbeiros"); return; }
    supabase.from("limites_agenda").select("dia_semana,limite_clientes").eq("barbeiro_id", booking.barbeiroId)
      .then(({ data }) => {
        const allDays = [0,1,2,3,4,5,6];
        const open = new Set((data ?? []).filter(l => l.limite_clientes > 0).map(l => l.dia_semana));
        setDiasFechados(allDays.filter(d => !open.has(d)));
      });
  }, [booking.barbeiroId, nav]);

  const today = new Date(); today.setHours(0,0,0,0);

  const next = () => {
    if (!date) return;
    bookingStore.set({ data: format(date, "yyyy-MM-dd") });
    nav("/cliente/horario");
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-primary uppercase tracking-wider">3 de 4</p>
        <h1 className="font-display text-3xl">Escolha a data</h1>
        <p className="text-muted-foreground text-sm">Com {booking.barbeiroNome}</p>
      </div>

      <div className="card-elegant p-3">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ptBR}
          disabled={(d) => d < today || diasFechados.includes(d.getDay())}
          className="p-3 pointer-events-auto"
        />
      </div>

      <Button
        onClick={next}
        disabled={!date}
        className="w-full bg-gradient-to-r from-primary to-[hsl(var(--gold-glow))] text-primary-foreground font-semibold h-12"
      >
        Continuar
      </Button>
    </div>
  );
}
