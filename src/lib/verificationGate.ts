/**
 * Backend verification gate.
 * Currently:
 * - Task posting: requires Aadhaar only.
 * - Offer submission: requires Aadhaar only (PAN and Bank optional for now).
 * Matches frontend logic so API cannot be bypassed.
 */

export interface VerificationGateProfile {
  userType?: "individual" | "business";
  isAadhaarVerified?: boolean;
  isBankVerified?: boolean;
  isPanVerified?: boolean;
  business?: {
    pan?: { isPANVerified?: boolean };
  };
}

export interface VerificationGateResult {
  allowed: boolean;
  missing: string[];
}

function isPanVerified(profile: VerificationGateProfile | null): boolean {
  if (!profile) return false;
  if (profile.userType === "business") {
    return Boolean(profile.business?.pan?.isPANVerified);
  }
  return Boolean(profile.isPanVerified);
}

/**
 * Returns whether the user has completed required verifications for posting a task.
 * Currently only Aadhaar is required for task creation.
 */
export function getTaskPostingVerificationStatus(
  profile: VerificationGateProfile | null
): VerificationGateResult {
  const missing: string[] = [];
  if (!profile) {
    return { allowed: false, missing: ["Aadhaar"] };
  }
  if (!profile.isAadhaarVerified) missing.push("Aadhaar");
  return {
    allowed: missing.length === 0,
    missing,
  };
}

/**
 * Offer submission gate: Aadhaar + Bank + PAN (business can satisfy via business PAN).
 */
export function getOfferSubmissionVerificationStatus(
  profile: VerificationGateProfile | null
): VerificationGateResult {
  const missing: string[] = [];
  if (!profile) {
    return { allowed: false, missing: ["Aadhaar"] };
  }
  if (!profile.isAadhaarVerified) missing.push("Aadhaar");
  return {
    allowed: missing.length === 0,
    missing,
  };
}
