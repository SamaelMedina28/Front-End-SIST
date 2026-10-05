import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { roleLabels, type Role } from "@/lib/constants/presentation";

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone="info"><ShieldCheck aria-hidden="true" size={14} />{roleLabels[role]}</Badge>;
}
