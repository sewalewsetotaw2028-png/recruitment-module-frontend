export function generateMeetingLink(base: string, seed: string, idx?: number) {
  const suffix = idx != null ? `-${idx}` : '';
  return `${base}/${seed.replace(/\s+/g, '-').toLowerCase()}${suffix}`;
}
