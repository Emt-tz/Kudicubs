"use server";

import { createClient } from "@/lib/supabase/server";
import { TOPICS, validateContact, type ContactErrors } from "./validate";

export type SubmitContactResult =
  | { ok: true; reference: string; email: string }
  | { ok: false; kind: "invalid"; errors: ContactErrors }
  | { ok: false; kind: "failed"; message: string };

/** Validates again on the server, then stores the message through the `submit_contact` RPC (anon client, RLS applies). */
export async function submitContact(input: { name: string; email: string; topic: string; message: string }): Promise<SubmitContactResult> {
  const name = String(input?.name ?? "").trim();
  const email = String(input?.email ?? "").trim();
  const message = String(input?.message ?? "").trim();
  const topicRaw = String(input?.topic ?? "");
  const topic = (TOPICS as readonly string[]).includes(topicRaw) ? topicRaw : "";

  const errors = validateContact({ name, email, topic, message });
  if (Object.keys(errors).length > 0) return { ok: false, kind: "invalid", errors };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_contact", { p_name: name, p_email: email, p_topic: topic, p_message: message });
    if (error || typeof data !== "string" || !data) {
      return { ok: false, kind: "failed", message: "We could not send your message. Your words are still here, so please try again in a minute." };
    }
    return { ok: true, reference: data, email };
  } catch {
    return { ok: false, kind: "failed", message: "We could not send your message. Your words are still here, so please try again in a minute." };
  }
}
