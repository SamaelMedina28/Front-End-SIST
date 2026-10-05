import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ticketPriorityLabels, ticketPriorityTones, type TicketPriority } from "@/lib/constants/presentation";

const priorityIcons = { LOW: ArrowDown, MEDIUM: Minus, HIGH: ArrowUp } as const;

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const Icon = priorityIcons[priority];
  return <Badge tone={ticketPriorityTones[priority]}><Icon aria-hidden="true" size={14} />{ticketPriorityLabels[priority]}</Badge>;
}
