import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface B { id: string; nome: string; telefone: string | null; }

export default function Equipe() {
  const { user } = useAuth();
  const [list, setList] = useState<B[] | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<B | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", password: "" });

  const load = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "barbeiro");
    const ids = (roles ?? []).map(r => r.user_id);
    if (!ids.length) return setList([]);
    const { data: profs } = await supabase.from("profiles").select("id,nome,telefone").in("id", ids).order("nome");
    setList(profs ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.nome.trim().length < 2) return toast.error("Nome muito curto");
    if (!form.email.includes("@")) return toast.error("Email inválido");
    if (form.password.length < 6) return toast.error("Senha mínima de 6 caracteres");
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("manage-barbeiros", {
      body: { action: "create", ...form, email: form.email.toLowerCase().trim() },
    });
    setSaving(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error ?? error?.message ?? "Erro");
    toast.success("Barbeiro adicionado");
    setForm({ nome: "", email: "", telefone: "", password: "" });
    setOpen(false);
    load();
  };

  const remove = async () => {
    if (!confirmDel) return;
    const { data, error } = await supabase.functions.invoke("manage-barbeiros", {
      body: { action: "delete", id: confirmDel.id },
    });
    if (error || (data as any)?.error) return toast.error((data as any)?.error ?? error?.message ?? "Erro");
    toast.success("Barbeiro removido");
    setConfirmDel(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Equipe</h1>
          <p className="text-muted-foreground text-sm">Gerencie os barbeiros</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      {!list && <div className="text-muted-foreground text-sm">Carregando...</div>}
      {list?.length === 0 && (
        <div className="card-elegant p-6 text-center text-muted-foreground">Nenhum barbeiro cadastrado.</div>
      )}

      <div className="space-y-3">
        {list?.map(b => (
          <div key={b.id} className="card-elegant p-4 flex items-center gap-4">
            <Avatar className="w-12 h-12 border border-border">
              <AvatarFallback className="bg-secondary text-primary font-display">
                {b.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{b.nome}</p>
              {b.telefone && <p className="text-xs text-muted-foreground">{b.telefone}</p>}
            </div>
            <button
              onClick={() => setConfirmDel(b)}
              disabled={b.id === user?.id}
              className="p-2 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive disabled:opacity-30"
              aria-label="Excluir"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={create}
            className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl gold-text">Novo barbeiro</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2"><Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="space-y-2"><Label>Email (login)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2"><Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="space-y-2"><Label>Senha inicial</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" required />
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground h-11">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Cadastrar
            </Button>
          </form>
        </div>
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir barbeiro?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDel?.nome} será removido permanentemente, junto com login, agenda e histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
