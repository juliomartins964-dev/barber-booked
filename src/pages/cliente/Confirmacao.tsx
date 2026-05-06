import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { bookingStore, useBooking } from "@/lib/booking";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Scissors, User, CheckCircle2 } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Confirmacao() {
  const nav = useNavigate();
  const b = useBooking();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!b.servicoId || !b.barbeiroId || !b.data || !b.hora) {
    nav("/cliente/servicos"); return null;
  }
  const dataObj = parse(b.data, "yyyy-MM-dd", new Date());

  const confirm = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      barbeiro_id: b.barbeiroId!,
      servico_id: b.servicoId!,
      data: b.data!,
      hora: b.hora!,
      status: "confirmado",
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("Esse horário acabou de ser ocupado");
      else toast.error("Não foi possível agendar");
      return;
    }
    toast.success("Agendamento confirmado!");
    bookingStore.reset();
    nav("/cliente/agendamentos");
  };

  return (
    <div className="space-y-5">
      <div className="text-center pt-4">
        <CheckCircle2 className="w-14 h-14 mx-auto text-primary mb-2" />
        <h1 className="font-display text-3xl">Confirmar</h1>
        <p className="text-muted-foreground text-sm">Revise antes de confirmar</p>
      </div>

      <div className="card-elegant p-5 space-y-4">
        <Row icon={User} label="Barbeiro" value={b.barbeiroNome!} />
        <Row icon={Scissors} label="Serviço" value={`${b.servicoNome} · ${b.servicoDuracao}min`} />
        <Row icon={Calendar} label="Data" value={format(dataObj, "EEEE, dd 'de' MMMM", { locale: ptBR })} />
        <Row icon={Clock} label="Horário" value={b.hora!} />
        <div className="border-t border-border pt-4 flex justify-between items-center">
          <span className="text-muted-foreground">Total</span>
          <span className="font-display text-2xl gold-text">R$ {b.servicoPreco?.toFixed(2)}</span>
        </div>
      </div>

      <Button onClick={confirm} disabled={loading} className="w-full bg-gradient-to-r from-primary to-[hsl(var(--gold-glow))] text-primary-foreground font-semibold h-12">
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Confirmar agendamento
      </Button>
    </div>
  );
}

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  </div>
);
