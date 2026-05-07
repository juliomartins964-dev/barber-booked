import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";

import Servicos from "./pages/cliente/Servicos";
import Barbeiros from "./pages/cliente/Barbeiros";
import DataSelect from "./pages/cliente/DataSelect";
import HorarioSelect from "./pages/cliente/HorarioSelect";
import Confirmacao from "./pages/cliente/Confirmacao";
import MeusAgendamentos from "./pages/cliente/MeusAgendamentos";

import AgendaDia from "./pages/barbeiro/AgendaDia";
import Atendimentos from "./pages/barbeiro/Atendimentos";
import Limites from "./pages/barbeiro/Limites";
import Equipe from "./pages/barbeiro/Equipe";

const queryClient = new QueryClient();

const Cliente = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allow={["cliente"]}><AppShell>{children}</AppShell></ProtectedRoute>
);
const Barbeiro = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allow={["barbeiro"]}><AppShell>{children}</AppShell></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner theme="dark" richColors position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            <Route path="/cliente/servicos" element={<Cliente><Servicos /></Cliente>} />
            <Route path="/cliente/barbeiros" element={<Cliente><Barbeiros /></Cliente>} />
            <Route path="/cliente/data" element={<Cliente><DataSelect /></Cliente>} />
            <Route path="/cliente/horario" element={<Cliente><HorarioSelect /></Cliente>} />
            <Route path="/cliente/confirmacao" element={<Cliente><Confirmacao /></Cliente>} />
            <Route path="/cliente/agendamentos" element={<Cliente><MeusAgendamentos /></Cliente>} />

            <Route path="/barbeiro/agenda" element={<Barbeiro><AgendaDia /></Barbeiro>} />
            <Route path="/barbeiro/atendimentos" element={<Barbeiro><Atendimentos /></Barbeiro>} />
            <Route path="/barbeiro/limites" element={<Barbeiro><Limites /></Barbeiro>} />
            <Route path="/barbeiro/equipe" element={<Barbeiro><Equipe /></Barbeiro>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
