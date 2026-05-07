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
    <div className="relative min-h-screen w-full flex items-center justify-center px-6 py-10 bg-background overflow-hidden">
      {/* Logo como marca d'água, sem overlay escuro */}
      <img
        src={logo}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <h1 className="font-display text-3xl gold-text">Barbearia Xandy</h1>
          <p className="text-muted-foreground text-sm">Estilo. Precisão. Tradição.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl"
        >
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-transparent border border-primary/60 hover:bg-primary/10 text-foreground font-semibold h-12"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Entrar
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-primary font-semibold">Criar conta</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
