import { AuthFrame } from "@/features/auth/components/auth-frame";
import { GoogleLoginButton } from "@/features/auth/components/google-login-button";
import { SessionGate } from "@/features/auth/components/session-gate";

export default function LoginPage() {
  return <AuthFrame title="Bienvenido a Soporte FCQI" description="Accede con tu cuenta institucional para recibir soporte técnico."><SessionGate mode="login"><GoogleLoginButton /></SessionGate></AuthFrame>;
}
