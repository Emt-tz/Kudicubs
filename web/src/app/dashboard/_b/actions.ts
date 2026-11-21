"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireParent } from "@/lib/auth/session";
import { AVATARS, BANDS, NICKNAMES, NOTIF_READ_COOKIE, REGIONS, WEAK_PINS } from "./consts";
import type { ChildFormState, ChildFormValues, PinFormErrors, PinFormState, SimpleFormState } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Create ("new") or update a child's nickname, age band, region and avatar. Saved -> redirect with a confirmation. */
export async function saveChild(_prev: ChildFormState, formData: FormData): Promise<ChildFormState> {
  const parent = await requireParent();
  const id = str(formData.get("id"));
  const values: ChildFormValues = {
    nickname: str(formData.get("nickname")),
    ageBand: str(formData.get("ageBand")),
    region: str(formData.get("region")),
    avatar: str(formData.get("avatar")),
  };
  const errors: NonNullable<ChildFormState>["errors"] = {};
  const supabase = await createClient();

  let current: { nickname: string; age_band: string } | null = null;
  if (id !== "new") {
    if (!UUID.test(id)) return { values, errors: { form: "We could not find that child." } };
    const { data } = await supabase.from("child_profiles").select("nickname,age_band").eq("id", id).is("deleted_at", null).maybeSingle();
    if (!data) return { values, errors: { form: "We could not find that child." } };
    current = data;
  }

  const nickOk = (NICKNAMES as readonly string[]).includes(values.nickname) || (current !== null && values.nickname === current.nickname);
  if (!nickOk) errors.nickname = "Please choose a nickname from the list. Real names are not allowed.";
  if (!BANDS.some((b) => b.value === values.ageBand)) errors.ageBand = "Please choose an age band.";
  if (!REGIONS.some((r) => r.value === values.region)) errors.region = "Please choose Ghana, Nigeria or the United Kingdom.";
  if (!(AVATARS as readonly string[]).includes(values.avatar)) errors.avatar = "Please choose an avatar.";
  if (Object.keys(errors).length) return { values, errors };

  const row = { nickname: values.nickname, age_band: values.ageBand, region: values.region, avatar: values.avatar };
  let childId = id;
  if (id === "new") {
    const { data, error } = await supabase.from("child_profiles").insert({ ...row, parent_id: parent.userId }).select("id").single();
    if (error || !data) return { values, errors: { form: "We could not save. Check your connection and try again." } };
    childId = data.id;
  } else {
    const { data, error } = await supabase.from("child_profiles").update(row).eq("id", id).select("id");
    if (error || !data?.length) return { values, errors: { form: "We could not save. Check your connection and try again." } };
  }
  revalidatePath("/dashboard", "layout");
  const bandChanged = current !== null && current.age_band !== values.ageBand;
  redirect(`/dashboard/children/${childId}/settings?saved=${id === "new" ? "new" : bandChanged ? "band" : "1"}`);
}

/** Family region (the only family-level setting the account stores). */
export async function saveFamilyRegion(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const parent = await requireParent();
  const region = str(formData.get("region"));
  if (!REGIONS.some((r) => r.value === region)) return { ok: false, message: "Please choose Ghana, Nigeria or the United Kingdom." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("parents").update({ region }).eq("id", parent.userId).select("id");
  if (error || !data?.length) return { ok: false, message: "We could not save your region. Please try again." };
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Saved. Your family region is updated." };
}

/**
 * Change the parent PIN. The current PIN is checked with verify_pin (which counts tries and locks after 5),
 * the new one is stored with set_pin. Cheap checks (format, weak, mismatch) run first so they never cost a try.
 */
export async function changePin(_prev: PinFormState, formData: FormData): Promise<PinFormState> {
  await requireParent();
  const current = str(formData.get("current"));
  const next = str(formData.get("next"));
  const confirm = str(formData.get("confirm"));
  const errors: PinFormErrors = {};

  if (!/^\d{4}$/.test(next)) errors.next = "Your new PIN needs exactly 4 digits.";
  else if (WEAK_PINS.includes(next)) errors.next = "Please choose a harder PIN. Avoid 1234 and repeated digits.";
  if (!errors.next && confirm !== next) errors.confirm = "The two new PINs do not match.";
  if (!/^\d{4}$/.test(current)) errors.current = "Enter your current 4-digit PIN.";
  if (Object.keys(errors).length) return { errors };

  const supabase = await createClient();
  const checked = await supabase.rpc("verify_pin", { pin: current });
  if (checked.error) return { errors: { form: "We could not check your PIN. Check your connection and try again." } };
  if (checked.data === "locked") return { errors: { current: "Too many wrong tries. Please wait 5 minutes, then try again.", form: "Your PIN is locked for now." } };
  if (checked.data !== "ok") return { errors: { current: "That PIN does not match your current PIN." } };

  const saved = await supabase.rpc("set_pin", { pin: next });
  if (saved.error) {
    if (/pin_weak/.test(saved.error.message)) return { errors: { next: "Please choose a harder PIN. Avoid 1234 and repeated digits." } };
    if (/pin_format/.test(saved.error.message)) return { errors: { next: "Your new PIN needs exactly 4 digits." } };
    return { errors: { form: "We could not change your PIN. Please try again." } };
  }
  redirect("/dashboard/settings?pin=changed");
}

/** Sign a device out of the family (removes it from the family's device list). */
export async function signOutDevice(formData: FormData): Promise<void> {
  await requireParent();
  const id = str(formData.get("deviceId"));
  if (!UUID.test(id)) redirect("/dashboard/devices?done=error");
  const supabase = await createClient();
  const { data, error } = await supabase.from("devices").delete().eq("id", id).select("id");
  if (error || !data?.length) redirect("/dashboard/devices?done=error");
  revalidatePath("/dashboard/devices");
  redirect("/dashboard/devices?done=signedout");
}

/** Delete the whole family (delete_my_family), sign out, and show the deleted page. Needs the word DELETE. */
export async function deleteFamily(formData: FormData): Promise<void> {
  await requireParent();
  if (str(formData.get("confirm")).toUpperCase() !== "DELETE") redirect("/dashboard/devices?confirm=delete&err=confirm");
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_family");
  if (error) redirect("/dashboard/devices?confirm=delete&err=failed");
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  redirect("/dashboard/deleted");
}

/** Remember (in this browser) that notifications up to now were read. */
export async function markNotificationsRead(formData: FormData): Promise<void> {
  await requireParent();
  const tab = str(formData.get("tab"));
  (await cookies()).set(NOTIF_READ_COOKIE, String(Date.now()), { httpOnly: true, sameSite: "lax", path: "/dashboard", maxAge: 60 * 60 * 24 * 365 });
  redirect(`/dashboard/notifications${tab ? `?tab=${encodeURIComponent(tab)}` : ""}`);
}
