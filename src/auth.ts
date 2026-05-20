/*
 * 4-digit PIN protection for parent admin mode.
 * Threat model: a curious child with the tablet in hand. NOT a motivated attacker.
 * SHA-256(salt + pin) is security theatre against brute force (10k combinations),
 * but it stops a 5-year-old, which is what we need.
 */

const TRIVIAL_PINS = new Set([
  "0000", "1111", "2222", "3333", "4444",
  "5555", "6666", "7777", "8888", "9999",
  "1234", "4321", "1212", "2121", "0123",
]);

export function isTrivialPin(pin: string): boolean {
  return TRIVIAL_PINS.has(pin);
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashPin(pin: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const useSalt = salt ?? randomSalt();
  const hash = await sha256Hex(useSalt + ":" + pin);
  return { hash, salt: useSalt };
}

export async function verifyPin(pin: string, stored: { hash: string; salt: string }): Promise<boolean> {
  const { hash } = await hashPin(pin, stored.salt);
  return hash === stored.hash;
}

export const LOCKOUT_THRESHOLDS = [
  { attempts: 5, cooldownMs: 30_000 },
  { attempts: 10, cooldownMs: 5 * 60_000 },
];

export function computeLockedUntil(failedAttempts: number, now: number = Date.now()): number | null {
  let lockedUntil: number | null = null;
  for (const { attempts, cooldownMs } of LOCKOUT_THRESHOLDS) {
    if (failedAttempts >= attempts) lockedUntil = now + cooldownMs;
  }
  return lockedUntil;
}
