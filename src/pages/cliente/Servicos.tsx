import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { bookingStore } from "@/lib/booking";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors, User, Sparkles, Eye, Clock } from "lucide-react";
import logo from "@/assets/logo.png";

interface Servico {
  id: string; nome: string; duracao_minutos: number; preco: number;
}

const iconFor = (nome: string) => {
  const n = nome.toLowerCase();
  if (n.includes("sobranc")) return Eye;
  if (n.includes("barba") && !n.includes("corte")) return User;
  if (n.includes("corte") && n.includes("barba")) return Sparkles;
  return Scissors;
};

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
    <div className="space-y-6">
      {/* Logo banner em destaque */}
      <div className="rounded-2xl border border-border bg-black flex items-center justify-center p-6">
        <img src={logo} alt="Barbearia Xandy" className="w-full max-w-[260px] h-auto select-none" />
      </div>

      <div>
        <h1 className="font-display text-2xl gold-text">Escolha o serviço</h1>
        <p className="text-muted-foreground text-sm">Toque em um quadro para começar</p>
      </div>

      {!servicos && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      )}

      {servicos?.length === 0 && (
        <div className="card-elegant p-6 text-center text-muted-foreground">
          Nenhum serviço disponível.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {servicos?.map((s) => {
          const Icon = iconFor(s.nome);
          return (
            <button
              key={s.id}
              onClick={() => pick(s)}
              className="group relative aspect-square rounded-2xl border border-border bg-card hover:border-primary hover:bg-secondary transition flex flex-col items-center justify-center p-4 text-center"
            >
              <Icon className="w-12 h-12 text-primary mb-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <p className="font-semibold text-sm leading-tight">{s.nome}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1.5">
                <Clock className="w-3 h-3" />
                <span>{s.duracao_minutos}min</span>
                <span className="text-primary font-bold">R${Number(s.preco).toFixed(0)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
