/**
 * Backend verification gate: require Aadhaar, PAN, and Bank verified
 * before allowing task posting or offer submission.
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
 * Returns whether the user has completed required verifications (Aadhaar, Bank, PAN)
 * for posting a task or submitting an offer.
 */
export function getTaskPostingVerificationStatus(
  profile: VerificationGateProfile | null
): VerificationGateResult {
  const missing: string[] = [];
  if (!profile) {
    return { allowed: false, missing: ["Aadhaar", "Bank", "PAN"] };
  }
  if (!profile.isAadhaarVerified) missing.push("Aadhaar");
  if (!profile.isBankVerified) missing.push("Bank");
  if (!isPanVerified(profile)) missing.push("PAN");
  return {
    allowed: missing.length === 0,
    missing,
  };
}

export const getOfferSubmissionVerificationStatus = getTaskPostingVerificationStatus;
