import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) return toast.error("Email ou senha inválidos");
    toast.success("Bem-vindo!");
    nav("/");
  };

  return (
    <div className="mobile-shell flex flex-col items-center justify-center px-6 py-10 min-h-screen">
      <img src={logo} alt="Logo" className="w-24 h-24 mb-4" />
      <h1 className="font-display text-4xl gold-text mb-1">Barbearia</h1>
      <p className="text-muted-foreground mb-10 text-sm">Estilo. Precisão. Tradição.</p>

      <form onSubmit={onSubmit} className="w-full space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
        </div>
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-[hsl(var(--gold-glow))] text-primary-foreground font-semibold h-12">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link to="/cadastro" className="text-primary font-semibold">Criar conta</Link>
      </p>
    </div>
  );
}
