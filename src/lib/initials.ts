/** Avatar letters: a lone yod or vav looks like a stray mark, so show two letters in that case. */
export function initials(name: string): string {
  const n = name.trim();
  if (!n) return '🙂';
  return /^[יו]/.test(n) ? n.slice(0, 2) : n.slice(0, 1);
}
