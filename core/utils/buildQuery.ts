export function buildQuery(obj: Record<string, any>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === "" || v == null) continue;
    if (typeof v === "boolean") {
      if (v) qs.append(k, "true");
      continue;
    }
    if (Array.isArray(v)) {
      if (v.length) v.forEach((x) => qs.append(k, String(x)));
      continue;
    }
    qs.append(k, String(v));
  }
  return qs.toString();
}
