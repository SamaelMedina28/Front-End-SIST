import type { components, paths } from "@/types/api.generated";

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];

export type Role = ApiSchemas["User"]["role"];
export type TicketStatus = ApiSchemas["TicketListItem"]["status"];
export type TicketPriority = ApiSchemas["TicketListItem"]["priority"];
