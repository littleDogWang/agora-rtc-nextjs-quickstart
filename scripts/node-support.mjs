export const supportedNodeDescription = 'Node.js 22.x or 24.x';

export function isSupportedNodeVersion(version) {
  const match = /^v?(\d+)(?:\.|$)/.exec(version);
  if (!match) return false;

  const major = Number.parseInt(match[1], 10);
  return major === 22 || major === 24;
}
