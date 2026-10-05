import { CircleCheck, CircleDot, CirclePause, CircleX, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ticketStatusLabels, ticketStatusTones, type TicketStatus } from "@/lib/constants/presentation";

const statusIcons = { OPEN: CircleDot, IN_REVIEW: Eye, IN_PROGRESS: CirclePause, COMPLETED: CircleCheck, CANCELLED: CircleX } as const;

export function StatusBadge({ status }: { status: TicketStatus }) {
  const Icon = statusIcons[status];
  return <Badge tone={ticketStatusTones[status]}><Icon aria-hidden="true" size={14} />{ticketStatusLabels[status]}</Badge>;
}
