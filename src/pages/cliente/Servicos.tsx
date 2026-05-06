import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { bookingStore } from "@/lib/booking";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ChevronRight } from "lucide-react";

interface Servico {
  id: string; nome: string; duracao_minutos: number; preco: number;
}

export default function Servicos() {
  const nav = useNavigate();
  const [servicos, setServicos] = useState<Servico[] | null>(null);

  useEffect(() => {
    supabase.from("servicos").select("*").eq("ativo", true).order("nome")
      .then(({ data }) => setServicos(data ?? []));
  }, []);

  const pick = (s: Servico) => {
    bookingStore.reset();
    bookingStore.set({
      servicoId: s.id, servicoNome: s.nome,
      servicoDuracao: s.duracao_minutos, servicoPreco: Number(s.preco),
    });
    nav("/cliente/barbeiros");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Serviços</h1>
        <p className="text-muted-foreground text-sm">Escolha o que você quer fazer</p>
      </div>

      {!servicos && (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {servicos?.length === 0 && (
        <div className="card-elegant p-6 text-center text-muted-foreground">
          Nenhum serviço disponível.
        </div>
      )}

      <div className="space-y-3">
        {servicos?.map((s) => (
          <button
            key={s.id}
            onClick={() => pick(s)}
            className="w-full card-elegant p-4 flex items-center justify-between hover:border-primary transition group"
          >
            <div className="text-left">
              <p className="font-semibold text-lg">{s.nome}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.duracao_minutos}min</span>
                <span className="text-primary font-semibold">R$ {Number(s.preco).toFixed(2)}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
          </button>
        ))}
      </div>
    </div>
  );
}
