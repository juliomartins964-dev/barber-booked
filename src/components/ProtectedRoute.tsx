import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children, allow }: { children: React.ReactNode; allow?: AppRole[] }) => {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allow && role && !allow.includes(role)) {
    return <Navigate to={role === "barbeiro" ? "/barbeiro/agenda" : "/cliente/servicos"} replace />;
  }
  return <>{children}</>;
};
