import i18n from "./i18n";

/**
 * Translate Rust/backend error keys.
 * - `errors.some_key`
 * - `errors.some_key|name=value|…`
 */
export function te(error: unknown): string {
  let text: string;
  if (typeof error === "string") text = error;
  else if (error instanceof Error) text = error.message;
  else text = String(error);

  text = text.replace(/\s+/g, " ").trim();
  if (!text) return i18n.t("errors.unknown");

  // Strip accidental "Error: " wrappers from some invoke paths.
  const normalized = text.replace(/^error:\s*/i, "");
  const [head, ...rest] = normalized.split("|");
  const key = head.trim();
  const known =
    i18n.exists(key) ||
    (key.startsWith("errors.") && i18n.exists(key, { ns: "translation" }));
  if (known || key.startsWith("errors.")) {
    const vars: Record<string, string> = {};
    for (const part of rest) {
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      const name = part.slice(0, eq).trim();
      let value = part.slice(eq + 1).trim();
      if (i18n.exists(value)) value = i18n.t(value);
      vars[name] = value;
    }
    return i18n.t(key, vars);
  }

  const MAX = 280;
  return text.length <= MAX ? text : `${text.slice(0, MAX)}…`;
}
