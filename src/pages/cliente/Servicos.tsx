import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { bookingStore } from "@/lib/booking";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors, User, Sparkles, Eye, Footprints, ChevronRight } from "lucide-react";

interface Servico {
  id: string; nome: string; duracao_minutos: number; preco: number;
}

const iconFor = (nome: string) => {
  const n = nome.toLowerCase();
  if (n.includes("sobranc")) return Eye;
  if (n.includes("pezinho") || n.includes("pé")) return Footprints;
  if (n.includes("barba") && !n.includes("corte")) return User;
  if (n.includes("corte") && n.includes("barba")) return Sparkles;
  return Scissors;
};

export default function Servicos() {
  const nav = useNavigate();
  const [servicos, setServicos] = useState<Servico[] | null>(null);

  useEffect(() => {
    supabase.from("servicos").select("*").eq("ativo", true).order("preco")
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
      <div className="text-center">
        <h1 className="font-display text-2xl">Serviços</h1>
        <p className="text-muted-foreground text-xs mt-1">Selecione o serviço desejado</p>
      </div>

      {!servicos && (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      )}

      {servicos?.length === 0 && (
        <div className="card-elegant p-6 text-center text-muted-foreground">
          Nenhum serviço disponível.
        </div>
      )}

      <div className="space-y-3">
        {servicos?.map((s) => {
          const Icon = iconFor(s.nome);
          return (
            <button
              key={s.id}
              onClick={() => pick(s)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary hover:bg-secondary/50 transition text-left"
            >
              <div className="w-12 h-12 rounded-xl border border-border bg-secondary/40 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary" strokeWidth={1.7} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base leading-tight">{s.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.duracao_minutos} min</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-display text-lg text-primary">
                  R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
