/** Tauri commands reject with plain strings; normalize anything thrown into a short message.
 * Prefer `te(error)` from `shared/i18n` so Rust keys are translated.
 */
export function toMessage(error: unknown): string {
  let text: string;
  if (typeof error === "string") text = error;
  else if (error instanceof Error) text = error.message;
  else text = String(error);

  text = text.replace(/\s+/g, " ").trim();
  const MAX_NOTICE = 280;
  if (text.length <= MAX_NOTICE) return text;
  return `${text.slice(0, MAX_NOTICE)}…`;
}
