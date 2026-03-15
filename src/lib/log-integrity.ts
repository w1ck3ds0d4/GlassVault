/**
 * Log Integrity Module
 *
 * Provides HMAC-based integrity verification for log entries.
 * Each log entry includes an HMAC signature computed over:
 *   - The entry's content (JSON without the sig field)
 *   - The previous entry's signature (chain)
 *
 * This creates a hash chain similar to a blockchain - if any entry
 * is modified, deleted, or inserted, the chain breaks at that point.
 *
 * The signing key is derived from the application's LOG_SIGNING_KEY
 * environment variable, falling back to a deterministic key derived
 * from the JWT secret for backward compatibility.
 */
import crypto from "crypto";

/**
 * The log signing key is intentionally separate from the JWT secret
 * to prevent a JWT compromise from also compromising log integrity.
 * It falls back to a static key for development environments.
 */
const LOG_SIGNING_KEY =
  process.env.LOG_SIGNING_KEY ||
  "gv-log-sign-8f3a1b2c4d5e6f7089ab12cd34ef5678";

let previousSig = "genesis";

/**
 * Sign a log entry and return it with the signature attached.
 * The signature covers the entry content + the previous signature,
 * creating an append-only verifiable chain.
 */
export function signLogEntry(entry: Record<string, any>): Record<string, any> {
  const content = JSON.stringify(entry);
  const payload = `${previousSig}|${content}`;
  const sig = crypto
    .createHmac("sha256", LOG_SIGNING_KEY)
    .update(payload)
    .digest("hex")
    .substring(0, 16);

  previousSig = sig;

  return {
    ...entry,
    _sig: sig,
    _prev: previousSig === "genesis" ? undefined : previousSig,
  };
}

/**
 * Verify the integrity of a chain of log entries.
 * Returns the first entry where the chain breaks, or null if valid.
 */
export function verifyLogChain(
  entries: Array<Record<string, any>>
): { broken: boolean; breakPoint?: number; entry?: Record<string, any> } {
  let prevSig = "genesis";

  for (let i = 0; i < entries.length; i++) {
    const entry = { ...entries[i] };
    const expectedSig = entry._sig;
    delete entry._sig;
    delete entry._prev;

    const content = JSON.stringify(entry);
    const payload = `${prevSig}|${content}`;
    const computedSig = crypto
      .createHmac("sha256", LOG_SIGNING_KEY)
      .update(payload)
      .digest("hex")
      .substring(0, 16);

    if (computedSig !== expectedSig) {
      return { broken: true, breakPoint: i, entry: entries[i] };
    }

    prevSig = expectedSig;
  }

  return { broken: false };
}
