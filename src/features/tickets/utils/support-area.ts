import type { SupportArea } from "../api";

const supportAreaLabels: Record<SupportArea, string> = {
  HARDWARE: "Hardware",
  SOFTWARE: "Software",
  NETWORKS: "Redes",
  ADMINISTRATIVE: "Administrativo",
};

export function isSupportArea(value: string | undefined): value is SupportArea {
  return value !== undefined && Object.hasOwn(supportAreaLabels, value);
}

export function supportAreaLabel(area: SupportArea) {
  return supportAreaLabels[area];
}
