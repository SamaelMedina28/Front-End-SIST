import { AuthFrame } from "@/features/auth/components/auth-frame";
import { CompleteProfileForm } from "@/features/auth/components/complete-profile-form";
import { SessionGate } from "@/features/auth/components/session-gate";

export default function CompleteProfilePage() {
  return <AuthFrame title="Completa tu registro" description="Necesitamos tus datos institucionales para darte acceso al sistema."><SessionGate mode="onboarding"><CompleteProfileForm /></SessionGate></AuthFrame>;
}
