"use client";

import { useRef, useState } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { googleLoginUrl } from "../api";
import { AuthError } from "./auth-error";

export function GoogleLoginButton() {
  const navigating = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  function login() {
    if (navigating.current) return;
    navigating.current = true;
    setPending(true);
    try { window.location.assign(googleLoginUrl()); }
    catch (error) { navigating.current = false; setPending(false); setError(error); }
  }
  return <div className="space-y-4">
    <Button className="w-full" disabled={pending} onClick={login}><LogIn size={18} aria-hidden="true" />{pending ? "Conectando con Google…" : "Continuar con Google"}</Button>
    <p className="text-center text-sm text-muted-foreground">Utiliza tu cuenta institucional UABC.</p>
    {error ? <AuthError error={error} onRetry={login} /> : null}
  </div>;
}
