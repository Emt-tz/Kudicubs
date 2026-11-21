"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  SendCodeResult,
  SignInArea,
  VerifyCodeResult,
} from "./types";

/*
 * Email one-time-code sign-in.
 *
 * Supabase answers a wrong code and an expired code with the same error, so the 10-minute
 * lifetime and the 5-attempt limit shown in the designs are tracked in a small httpOnly cookie
 * (UX only: Supabase itself still enforces expiry and its own rate limits).
 */

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_AFTER_SECONDS = 45;
const COOKIE = "kc_code";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type CodeCookie = { e: string; t: number; f: number };

async function readCodeCookie(): Promise<CodeCookie | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as CodeCookie;
    return typeof v.e === "string" && typeof v.t === "number" && typeof v.f === "number" ? v : null;
  } catch {
    return null;
  }
}

async function writeCodeCookie(v: CodeCookie | null): Promise<void> {
  const store = await cookies();
  if (!v) {
    store.delete(COOKIE);
    return;
  }
  store.set(COOKIE, JSON.stringify(v), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CODE_TTL_MS / 1000,
  });
}

const normalise = (email: string) => email.trim().toLowerCase();

export async function sendCode(email: string, area: SignInArea = "dashboard"): Promise<SendCodeResult> {
  const clean = normalise(String(email ?? ""));
  if (!EMAIL_RE.test(clean) || clean.length > 254) {
    return { ok: false, error: "invalid_email", message: "Please check the email address. It should look like name@example.com." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    // Only the parent sign-in may create a family; family and staff sign-in never create accounts.
    options: { shouldCreateUser: area === "dashboard" },
  });

  if (error) {
    const code = (error as { code?: string }).code ?? "";
    const status = (error as { status?: number }).status ?? 0;
    if (code === "otp_disabled" || code === "signup_disabled" || /signups? not allowed/i.test(error.message)) {
      // Staff sign-in must not reveal whether an address is staff: behave as if sent.
      if (area === "team") {
        await writeCodeCookie({ e: clean, t: Date.now(), f: 0 });
        return { ok: true, email: clean, resendAfterSeconds: RESEND_AFTER_SECONDS };
      }
      return { ok: false, error: "no_family", message: "We could not find a family with that email. Check the spelling, or use the email you gave when you set up KudiCubs." };
    }
    if (status === 429 || code.includes("rate_limit")) {
      return { ok: false, error: "rate_limited", message: "That was a lot of codes. Please wait a minute and try again." };
    }
    if (code === "email_address_invalid" || code === "validation_failed") {
      return { ok: false, error: "invalid_email", message: "Please check the email address. It should look like name@example.com." };
    }
    return { ok: false, error: "send_failed", message: "We could not send a code. Check the email address and try again." };
  }

  await writeCodeCookie({ e: clean, t: Date.now(), f: 0 });
  return { ok: true, email: clean, resendAfterSeconds: RESEND_AFTER_SECONDS };
}

export async function verifyCode(email: string, code: string, area: SignInArea = "dashboard"): Promise<VerifyCodeResult> {
  const clean = normalise(String(email ?? ""));
  const token = String(code ?? "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) {
    return { ok: false, error: "invalid_code_format", message: "Enter the 6-digit code from the email." };
  }

  const track = await readCodeCookie();
  const mine = track && track.e === clean ? track : null;

  if (mine && Date.now() - mine.t > CODE_TTL_MS) {
    return { ok: false, error: "expired_code", message: "Code expired. The code we sent is more than 10 minutes old." };
  }
  if (mine && mine.f >= MAX_ATTEMPTS) {
    return { ok: false, error: "too_many_attempts", message: "Too many wrong codes. Ask for a new code to carry on.", attemptsLeft: 0 };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: clean, token, type: "email" });

  if (error) {
    const status = (error as { status?: number }).status ?? 0;
    const errCode = (error as { code?: string }).code ?? "";
    if (status === 429 || errCode.includes("rate_limit")) {
      return { ok: false, error: "too_many_attempts", message: "Too many tries. Ask for a new code to carry on.", attemptsLeft: 0 };
    }
    if (status >= 500) {
      return { ok: false, error: "unknown", message: "Something went wrong on our side. Please try again." };
    }
    // Wrong, expired or already-used code (Supabase does not say which).
    const failures = (mine?.f ?? 0) + 1;
    await writeCodeCookie({ e: clean, t: mine?.t ?? Date.now(), f: failures });
    const left = Math.max(0, MAX_ATTEMPTS - failures);
    if (left === 0) {
      return { ok: false, error: "too_many_attempts", message: "Too many wrong codes. Ask for a new code to carry on.", attemptsLeft: 0 };
    }
    return {
      ok: false,
      error: "wrong_code",
      message: `That code is not right. You have ${left} attempt${left === 1 ? "" : "s"} left. Check the latest email we sent.`,
      attemptsLeft: left,
    };
  }

  await writeCodeCookie(null);
  if (area === "team") {
    const { data } = await supabase.auth.getUser();
    const { data: staff } = await supabase
      .from("staff_users")
      .select("user_id")
      .eq("user_id", data.user?.id ?? "")
      .maybeSingle();
    return { ok: true, redirectTo: staff ? "/team/families" : "/team/no-access" };
  }
  return { ok: true, redirectTo: "/dashboard" };
}

/** Sign out of the current area and land on that area's signed-out page. */
export async function signOut(area: SignInArea = "dashboard"): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await writeCodeCookie(null);
  redirect(area === "team" ? "/team/signed-out" : area === "family" ? "/" : "/dashboard/signin");
}
