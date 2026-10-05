"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createActivityLog, updateActivityLog, type ActivityLogCreateRequest, type ActivityLogPatchRequest } from "../api";
import { activityLogDetailKey, activityLogHistoryKey, activityLogsKey } from "../queries/activity-log";

export function useCreateActivityLog() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (body: ActivityLogCreateRequest) => createActivityLog(body), retry: false,
    onSuccess: async (entry) => Promise.all([
      queryClient.invalidateQueries({ queryKey: activityLogsKey }),
      queryClient.invalidateQueries({ queryKey: ["tickets", entry.ticket.id] }),
    ]) });
}

export function useUpdateActivityLog(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (body: ActivityLogPatchRequest) => updateActivityLog(id, body), retry: false,
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: activityLogsKey }),
      queryClient.invalidateQueries({ queryKey: activityLogDetailKey(id) }),
      queryClient.invalidateQueries({ queryKey: activityLogHistoryKey(id) }),
    ]) });
}
