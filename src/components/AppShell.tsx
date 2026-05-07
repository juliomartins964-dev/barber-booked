import { NavLink, useNavigate } from "react-router-dom";
import { Calendar, Scissors, ListChecks, LogOut, Users, Clock, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const clienteNav = [
    { to: "/cliente/servicos", icon: Scissors, label: "Agendar" },
    { to: "/cliente/agendamentos", icon: ListChecks, label: "Meus" },
  ];
  const barbeiroNav = [
    { to: "/barbeiro/agenda", icon: Calendar, label: "Hoje" },
    { to: "/barbeiro/atendimentos", icon: Users, label: "Atend." },
    { to: "/barbeiro/limites", icon: Clock, label: "Agenda" },
    { to: "/barbeiro/equipe", icon: UserCog, label: "Equipe" },
  ];
  const nav = role === "barbeiro" ? barbeiroNav : clienteNav;

  return (
    <div className="mobile-shell bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-9 h-9" />
            <div>
              <p className="text-xs text-muted-foreground">Olá,</p>
              <p className="font-display text-base leading-tight gold-text">{profile?.nome || "Bem-vindo"}</p>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition text-sm font-medium"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4 text-primary" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="px-5 py-5">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="mobile-shell">
          <div className="mx-3 mb-3 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
              {nav.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-3 transition ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};
