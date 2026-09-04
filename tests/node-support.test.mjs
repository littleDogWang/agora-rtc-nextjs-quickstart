import { describe, expect, it } from 'vitest';
import { isSupportedNodeVersion } from '../scripts/node-support.mjs';

describe('Node.js support range', () => {
  it.each(['22.0.0', '22.22.1', '24.0.0', '24.7.0'])(
    'accepts supported LTS version %s',
    (version) => {
      expect(isSupportedNodeVersion(version)).toBe(true);
    },
  );

  it.each(['20.19.0', '23.11.1', '25.0.0', 'not-a-version'])(
    'rejects unsupported version %s',
    (version) => {
      expect(isSupportedNodeVersion(version)).toBe(false);
    },
  );
});
