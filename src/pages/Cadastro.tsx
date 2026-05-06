import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Scissors, User } from "lucide-react";
import logo from "@/assets/logo.png";
import { z } from "zod";

const schema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(100),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

export default function Cadastro() {
  const nav = useNavigate();
  const [tipo, setTipo] = useState<"cliente" | "barbeiro">("cliente");
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome: parsed.data.nome, telefone: parsed.data.telefone, tipo },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada!");
    nav("/");
  };

  return (
    <div className="mobile-shell px-6 py-8 min-h-screen">
      <img src={logo} alt="Logo" className="w-16 h-16 mx-auto mb-3" />
      <h1 className="font-display text-3xl text-center gold-text mb-1">Criar conta</h1>
      <p className="text-center text-sm text-muted-foreground mb-6">Comece a agendar seu corte</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {([
          { v: "cliente", label: "Cliente", icon: User },
          { v: "barbeiro", label: "Barbeiro", icon: Scissors },
        ] as const).map(({ v, label, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => setTipo(v)}
            className={`p-4 rounded-xl border transition ${
              tipo === v ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            <Icon className={`w-6 h-6 mx-auto mb-1 ${tipo === v ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium">{label}</p>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2"><Label>Nome</Label>
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
        </div>
        <div className="space-y-2"><Label>Telefone (com DDD)</Label>
          <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="11999999999" required />
        </div>
        <div className="space-y-2"><Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="space-y-2"><Label>Senha</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-[hsl(var(--gold-glow))] text-primary-foreground font-semibold h-12">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta? <Link to="/login" className="text-primary font-semibold">Entrar</Link>
      </p>
    </div>
  );
}
