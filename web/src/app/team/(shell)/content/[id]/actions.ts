"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const ID_RE = /^[\w.-]{1,64}$/;

/**
 * Publish / unpublish a mission. The database lets any staff user update missions, so the role rule
 * (only content and admin) is enforced here, before anything is written.
 */
export async function setMissionPublished(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const publish = String(formData.get("published") ?? "") === "true";
  if (!ID_RE.test(id)) redirect("/team/content");
  const dest = `/team/content/${encodeURIComponent(id)}`;

  const staff = await getStaff();
  if (!staff) redirect("/team/signin");
  if (staff.role !== "content" && staff.role !== "admin") redirect(`${dest}?notice=forbidden`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("missions")
    .update({ published: publish, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,published");
  if (error || !data?.length) redirect(`${dest}?notice=failed`);
  revalidatePath("/team/content");
  revalidatePath(dest);
  redirect(`${dest}?notice=${publish ? "published" : "unpublished"}`);
}
