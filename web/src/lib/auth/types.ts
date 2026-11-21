/** Which sign-in surface is asking. Decides redirects and whether unknown emails may be created. */
export type SignInArea = "dashboard" | "family" | "team";

export type SendCodeError =
  | "invalid_email" //  not an email address
  | "no_family" //      family sign-in only: no account for this email
  | "rate_limited" //   asked for too many codes
  | "send_failed"; //   the mail service failed

export type SendCodeResult =
  | { ok: true; email: string; resendAfterSeconds: number }
  | { ok: false; error: SendCodeError; message: string };

export type VerifyCodeError =
  | "invalid_code_format" // not 6 digits
  | "wrong_code" //          code does not match; attemptsLeft says how many tries remain
  | "expired_code" //        older than 10 minutes
  | "too_many_attempts" //   5 wrong tries (or Supabase rate limit); ask for a new code
  | "unknown";

export type VerifyCodeResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: VerifyCodeError; message: string; attemptsLeft?: number };

export type ParentSession = {
  userId: string;
  email: string;
  region: "gh" | "ng" | "uk";
  consentedAt: string | null;
};

export type StaffRole = "support" | "content" | "admin";

export type StaffSession = {
  userId: string;
  email: string;
  role: StaffRole;
};

/** Pages that do not need a session. Shared by the proxy and the tests. */
export const PUBLIC_DASHBOARD_PATHS = [
  "/dashboard/signin",
  "/dashboard/code",
  "/dashboard/session-timeout",
  "/dashboard/forbidden",
  "/dashboard/deleted",
] as const;

export const PUBLIC_TEAM_PATHS = [
  "/team/signin",
  "/team/no-access",
  "/team/error",
  "/team/signed-out",
] as const;
