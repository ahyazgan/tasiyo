// ── Admin yetki kontrolü (ayrı util — fast-refresh için bileşenden ayrık). ──

const ADMIN_EMAILS = ["a.hakan_@hotmail.com"]; // platform sahibi

export const isAdmin = (u) =>
  Boolean(u) && (u.role === "admin" || ADMIN_EMAILS.includes(String(u.email || "").toLowerCase()));
