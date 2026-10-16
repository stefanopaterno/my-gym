// crypto.randomUUID non esiste in contesti non sicuri (es. http://IP-LAN su iPhone).
export function uid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
