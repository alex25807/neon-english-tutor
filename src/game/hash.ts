export type HashView = "map" | "chat" | "progress" | "play";

export function parseHash(hash: string): HashView {
  const raw = hash.replace(/^#\/?/, "").split("/")[0].toLowerCase();
  if (raw === "chat" || raw === "progress" || raw === "play") return raw;
  return "map";
}

export function hashFor(view: HashView): string {
  return `#/${view}`;
}

export function writeHash(view: HashView, mode: "push" | "replace" = "push"): void {
  const next = hashFor(view);
  if (window.location.hash === next) return;
  if (mode === "replace") window.history.replaceState(null, "", next);
  else window.location.hash = next;
}
