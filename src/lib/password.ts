import { createHash, timingSafeEqual } from "crypto";

export function passwordMatches(provided: string, expected: string) {
  if (!provided || !expected) return false;
  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}
