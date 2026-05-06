import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav("/login", { replace: true });
    else if (role === "barbeiro") nav("/barbeiro/agenda", { replace: true });
    else nav("/cliente/servicos", { replace: true });
  }, [user, role, loading, nav]);
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
