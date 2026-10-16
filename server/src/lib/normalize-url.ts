export function normalizeHttpUrl(raw: string) {
  const s = (raw ?? '').trim();
  if (!s) return s;
  const l = s.toLowerCase();
  if (l.startsWith('http://') || l.startsWith('https://')) return s;
  return `https://${s}`;
}

export function isHttpPublicUrl(s: string) {
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return /\.[a-z]{2,}$/i.test(u.hostname);
  } catch {
    return false;
  }
}
