"use client";

import { useState } from "react";
import { AvatarFallback } from "@/components/ui/avatar";
import type { CurrentUser } from "../api";

function AvatarImage({ url, name, initials }: { url: string; name: string; initials: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <AvatarFallback className="shrink-0" aria-label={name}>{initials}</AvatarFallback>;
  // A plain image avoids a remote image proxy/allowlist; no referrer is sent.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`Foto de ${name}`} referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full border object-cover" onError={() => setFailed(true)} />;
}

export function UserAvatar({ user }: { user: Pick<CurrentUser, "fullName" | "avatarUrl"> }) {
  const initials = user.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toLocaleUpperCase("es-MX");
  let url: string | undefined;
  try {
    const parsed = new URL(user.avatarUrl ?? "");
    if (parsed.protocol === "https:" && !parsed.username && !parsed.password) url = parsed.href;
  } catch { /* Missing or invalid URLs use initials. */ }
  return url ? <AvatarImage key={url} url={url} name={user.fullName} initials={initials} />
    : <AvatarFallback className="shrink-0" aria-label={user.fullName}>{initials}</AvatarFallback>;
}
