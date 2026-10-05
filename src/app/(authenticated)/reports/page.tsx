import { ActivityReportView } from "@/features/reports/components/activity-report-view";
import { currentMonthRange } from "@/features/reports/utils/date-only";
import { activityReportFilterEntries, parseActivityReportFilters } from "@/features/reports/utils/report-filters";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = parseActivityReportFilters(await searchParams, currentMonthRange());
  return <ActivityReportView filters={parsed.filters} key={activityReportFilterEntries(parsed.filters)} rangeValid={parsed.rangeValid} shouldPersistDefaultRange={parsed.shouldPersistDefaultRange} />;
}
