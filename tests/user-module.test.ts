import { describe, expect, it } from "vitest";

import { createTicketRequest, createTicketSchema, type CreateTicketFormValues } from "../src/features/tickets/schemas/create-ticket";
import { countWords } from "../src/features/tickets/utils/description-words";
import { parseTicketFilters, ticketFilterEntries } from "../src/features/tickets/utils/ticket-filters";
import type { TicketFormCategory } from "../src/features/tickets/api";

const category: TicketFormCategory = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "EQUIP",
  name: "Equipo",
  supportArea: "HARDWARE",
  defaultPriority: "MEDIUM",
  requiresSoftwareDetails: false,
  subcategories: [{ id: "22222222-2222-4222-8222-222222222222", code: "PROJ", name: "Proyector", priority: null }],
};

const formValues: CreateTicketFormValues = {
  title: "Sin señal",
  categoryId: category.id,
  subcategoryId: category.subcategories[0].id,
  building: "Edificio 6",
  room: "603",
  description: "El proyector enciende, pero no muestra señal.",
  contactPhone: "",
  softwareName: "",
  softwareVersion: "",
  softwareDownloadUrl: "",
  coordinationApprovalReference: "",
};

describe("ticket form contract helpers", () => {
  it("counts description words rather than characters and handles whitespace", () => {
    expect(countWords("  uno\t dos\n tres  ")).toBe(3);
    expect(countWords(" \n ")).toBe(0);
  });

  it("accepts at most 50 words", () => {
    expect(createTicketSchema.safeParse({ ...formValues, description: Array.from({ length: 50 }, () => "palabra").join(" ") }).success).toBe(true);
    expect(createTicketSchema.safeParse({ ...formValues, description: Array.from({ length: 51 }, () => "palabra").join(" ") }).success).toBe(false);
  });

  it("builds only generated request fields and omits priority, status and absent inventory", () => {
    const body = createTicketRequest(formValues, category);
    expect(body).toEqual({
      title: "Sin señal",
      categoryId: category.id,
      subcategoryId: category.subcategories[0].id,
      building: "Edificio 6",
      room: "603",
      description: "El proyector enciende, pero no muestra señal.",
      contactPhone: null,
    });
    expect(body).not.toHaveProperty("status");
    expect(body).not.toHaveProperty("priority");
    expect(body).not.toHaveProperty("inventoryItemId");
  });

  it("includes the exact conditional software object only when the catalog requires it", () => {
    const softwareCategory: TicketFormCategory = { ...category, supportArea: "SOFTWARE", requiresSoftwareDetails: true, subcategories: [] };
    const values = { ...formValues, categoryId: softwareCategory.id, subcategoryId: "", softwareName: "App", softwareVersion: "4", softwareDownloadUrl: "https://example.invalid/app", coordinationApprovalReference: "REF-1" };
    expect(createTicketRequest(values, softwareCategory).software).toEqual({ name: "App", version: "4", downloadUrl: "https://example.invalid/app", coordinationApprovalReference: "REF-1" });
    expect(createTicketRequest({ ...values, softwareName: "" }, { ...softwareCategory, requiresSoftwareDetails: false })).not.toHaveProperty("software");
  });
});

describe("URL ticket filter validation", () => {
  it("keeps only valid contract filters and drops malformed values", () => {
    expect(parseTicketFilters({ page: "0", pageSize: "lots", status: "UNKNOWN", priority: "HIGH", categoryId: "not-a-uuid", search: "  proyector " })).toMatchObject({
      page: undefined,
      pageSize: undefined,
      status: undefined,
      priority: "HIGH",
      categoryId: undefined,
      search: "proyector",
    });
  });

  it("serializes real filters for URL pagination without adding identity filters", () => {
    const params = parseTicketFilters({ page: "2", pageSize: "10", status: "OPEN", search: "TK-123" });
    expect(ticketFilterEntries(params)).toBe("page=2&pageSize=10&search=TK-123&status=OPEN");
    expect(ticketFilterEntries(params)).not.toContain("userId");
  });

  it("parses only API-supported assignment and support-area filters", () => {
    expect(parseTicketFilters({ assignment: "mine", supportArea: "NETWORKS" })).toMatchObject({ assignment: "mine", supportArea: "NETWORKS" });
    expect(parseTicketFilters({ assignment: "everyone", supportArea: "OTHER" })).toMatchObject({ assignment: undefined, supportArea: undefined });
  });
});
