import { describe, expect, it } from "vitest";

import { currentMonthRange, formatDateOnly, formatResolutionMinutes, isDateOnly, isValidDateRange } from "./date-only";
import { activityReportFilterEntries, parseActivityReportFilters } from "./report-filters";

describe("date-only report helpers", () => {
  it("uses the Tijuana calendar month without shifting UTC-midnight date-only values", () => {
    expect(currentMonthRange(new Date("2026-10-01T06:30:00.000Z"))).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(formatDateOnly("2026-10-01")).toBe("01/10/2026");
  });

  it("validates real calendar dates and inclusive range ordering", () => {
    expect(isDateOnly("2024-02-29")).toBe(true);
    expect(isDateOnly("2026-02-29")).toBe(false);
    expect(isDateOnly("2026-13-01")).toBe(false);
    expect(isValidDateRange("2026-10-01", "2026-10-01")).toBe(true);
    expect(isValidDateRange("2026-10-02", "2026-10-01")).toBe(false);
  });

  it("formats backend resolution minutes without recalculating the average", () => {
    expect(formatResolutionMinutes(45)).toBe("45 min");
    expect(formatResolutionMinutes(90)).toBe("1 h 30 min");
    expect(formatResolutionMinutes(1500)).toBe("1 d 1 h");
    expect(formatResolutionMinutes(90.5)).toBe("1 h 30.5 min");
    expect(formatResolutionMinutes(-1)).toBe("—");
  });

  it("parses only real report filters, supplies the default period and retains date-only values", () => {
    const categoryId = "11111111-1111-4111-8111-111111111111";
    const technicianId = "22222222-2222-4222-8222-222222222222";
    const defaults = { from: "2026-10-01", to: "2026-10-05" };
    const initial = parseActivityReportFilters({}, defaults);
    expect(initial.filters).toEqual({ from: defaults.from, to: defaults.to, supportArea: undefined, categoryId: undefined, technicianId: undefined });
    expect(initial.shouldPersistDefaultRange).toBe(true);
    const parsed = parseActivityReportFilters({ from: "2026-09-01", to: "2026-09-30", supportArea: "NETWORKS", categoryId, technicianId, search: "ignored" }, defaults);
    expect(parsed.filters).toEqual({ from: "2026-09-01", to: "2026-09-30", supportArea: "NETWORKS", categoryId, technicianId });
    expect(activityReportFilterEntries(parsed.filters)).toBe(`from=2026-09-01&to=2026-09-30&supportArea=NETWORKS&categoryId=${categoryId}&technicianId=${technicianId}`);
    expect(parseActivityReportFilters({ from: "2026-10-09", to: "2026-10-01", supportArea: "OTHER", categoryId: "invalid" }, defaults).rangeValid).toBe(false);
  });
});
