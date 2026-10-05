"use client";

import Link from "next/link";
import { useRef } from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/features/auth/components/user-avatar";
import { AuthError } from "@/features/auth/components/auth-error";
import { useLogout } from "@/features/auth/mutations/session";
import type { CurrentUser } from "@/features/auth/api";
import { roleLabels } from "@/lib/constants/presentation";

export function Topbar({ onMenuClick, user }: { onMenuClick: () => void; user?: CurrentUser }) {
  const mutation = useLogout();
  const locked = useRef(false);
  async function signOut() {
    if (locked.current) return;
    locked.current = true;
    try { await mutation.mutateAsync(); }
    catch { /* The mutation error is rendered below, preserving the session. */ }
    finally { locked.current = false; }
  }
  return <>
    <header className="flex min-h-[72px] min-w-0 items-center justify-between gap-3 border-b-[3px] border-warning bg-primary px-4 py-3 text-primary-foreground shadow-sm md:px-8">
      <div className="flex shrink-0 items-center gap-3"><Button aria-label="Abrir navegación" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground md:hidden" onClick={onMenuClick} size="icon" variant="ghost"><Menu aria-hidden="true" size={20} /></Button><span className="hidden text-sm font-medium text-primary-foreground/80 lg:block">Soporte Técnico FCQI</span></div>
      {user ? <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="min-w-0 max-w-44 text-right sm:max-w-64"><p className="truncate text-sm font-medium" title={user.fullName}>{user.fullName}</p><p className="truncate text-xs text-[#ffe1a3]">{roleLabels[user.role]}</p></div>
        <UserAvatar user={user} />
        <Button aria-label="Cerrar sesión" disabled={mutation.isPending} onClick={() => { void signOut(); }} variant="ghost" className="shrink-0 px-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:px-3"><LogOut aria-hidden="true" size={18} /><span className="hidden sm:inline">{mutation.isPending ? "Cerrando…" : "Cerrar sesión"}</span></Button>
      </div> : <Link className="text-sm font-medium text-primary-foreground underline-offset-4 hover:underline" href="/login">Iniciar sesión</Link>}
    </header>
    {mutation.isError && <div className="p-4"><AuthError error={mutation.error} onRetry={() => { void signOut(); }} /></div>}
  </>;
}
