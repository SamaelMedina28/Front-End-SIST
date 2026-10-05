import { AuthFrame } from "@/features/auth/components/auth-frame";
import { SessionGate } from "@/features/auth/components/session-gate";

export default function AuthSuccessPage() {
  return <AuthFrame title="Verificando tu sesión" description="Estamos preparando tu acceso al sistema."><SessionGate mode="success" /></AuthFrame>;
}
