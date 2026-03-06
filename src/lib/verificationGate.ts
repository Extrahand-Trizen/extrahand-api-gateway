/**
 * Backend verification gate.
 * 
 * VERIFICATION FLOW:
 * Step 2: Posting/Applying - Phone + Email verification required
 * Step 3: Task Start - Aadhaar verification required (when tasker is selected)
 * Step 4: Task Completion - No additional verification
 * Step 5: Payment Withdrawal - PAN + Bank verification required
 * 
 * Matches frontend logic so API cannot be bypassed.
 */

export interface VerificationGateProfile {
  userType?: "individual" | "business";
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isAadhaarVerified?: boolean;
  isBankVerified?: boolean;
  isPanVerified?: boolean;
  business?: {
    pan?: { isPANVerified?: boolean };
    bankAccount?: { isVerified?: boolean };
  };
}

export interface VerificationGateResult {
  allowed: boolean;
  missing: string[];
  message?: string;
}

function isPanVerified(profile: VerificationGateProfile | null): boolean {
  if (!profile) return false;
  if (profile.userType === "business") {
    return !!profile.business?.pan?.isPANVerified;
  }
  return !!profile.isPanVerified;
}

function isBankVerified(profile: VerificationGateProfile | null): boolean {
  if (!profile) return false;
  if (profile.userType === "business") {
    return !!profile.business?.bankAccount?.isVerified;
  }
  return !!profile.isBankVerified;
}

/**
 * STEP 2: Returns whether the user can post a task.
 * Requirements: Phone + Email verification
 */
export function getTaskPostingVerificationStatus(
  profile: VerificationGateProfile | null
): VerificationGateResult {
  const missing: string[] = [];
  if (!profile) {
    return { 
      allowed: false, 
      missing: ["Phone", "Email"],
      message: "Please complete your profile to post tasks"
    };
  }
  if (!profile.isPhoneVerified) missing.push("Phone");
  if (!profile.isEmailVerified) missing.push("Email");
  return {
    allowed: missing.length === 0,
    missing,
    message: missing.length > 0 
      ? `Please verify your ${missing.join(" and ")} to post tasks` 
      : undefined
  };
}

/**
 * STEP 2: Offer submission gate (applying for tasks)
 * Requirements: Phone + Email verification (same as posting)
 */
export function getOfferSubmissionVerificationStatus(
  profile: VerificationGateProfile | null
): VerificationGateResult {
  const missing: string[] = [];
  if (!profile) {
    return { 
      allowed: false, 
      missing: ["Phone", "Email"],
      message: "Please complete your profile to apply for tasks"
    };
  }
  if (!profile.isPhoneVerified) missing.push("Phone");
  if (!profile.isEmailVerified) missing.push("Email");
  return {
    allowed: missing.length === 0,
    missing,
    message: missing.length > 0 
      ? `Please verify your ${missing.join(" and ")} to apply for tasks` 
      : undefined
  };
}

/**
 * STEP 3: Check if tasker can start a task (after being selected)
 * Requirements: Aadhaar or Government ID verification
 */
export function getTaskStartVerificationStatus(
  profile: VerificationGateProfile | null
): VerificationGateResult {
  const missing: string[] = [];
  if (!profile) {
    return { 
      allowed: false, 
      missing: ["Aadhaar"],
      message: "Identity verification required"
    };
  }
  if (!profile.isAadhaarVerified) missing.push("Aadhaar");
  return {
    allowed: missing.length === 0,
    missing,
    message: missing.length > 0 
      ? "Aadhaar verification required before starting the task" 
      : undefined
  };
}

/**
 * STEP 5: Check if user can withdraw payments
 * Requirements: PAN + Bank verification
 */
export function getPaymentWithdrawalVerificationStatus(
  profile: VerificationGateProfile | null
): VerificationGateResult {
  const missing: string[] = [];
  if (!profile) {
    return { 
      allowed: false, 
      missing: ["PAN", "Bank Account"],
      message: "Verification required for withdrawals"
    };
  }

  const panVerified = isPanVerified(profile);
  const bankVerified = isBankVerified(profile);

  if (!panVerified) missing.push("PAN");
  if (!bankVerified) missing.push("Bank Account");

  return {
    allowed: missing.length === 0,
    missing,
    message: missing.length > 0 
      ? `Please verify your ${missing.join(" and ")} to withdraw payments` 
      : undefined
  };
}
