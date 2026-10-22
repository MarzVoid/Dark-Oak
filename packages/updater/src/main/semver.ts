export function cleanVersion(v: string): string {
  return v.trim().replace(/^v/i, '');
}

export function compareSemver(v1: string, v2: string): number {
  const clean1 = cleanVersion(v1);
  const clean2 = cleanVersion(v2);

  const [main1, pre1] = clean1.split('-');
  const [main2, pre2] = clean2.split('-');

  const parts1 = main1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = main2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  if (pre1 && !pre2) return -1;
  if (!pre1 && pre2) return 1;
  if (pre1 && pre2) {
    return pre1.localeCompare(pre2);
  }

  return 0;
}

export function isNewerVersion(remote: string, current: string): boolean {
  return compareSemver(remote, current) > 0;
}
