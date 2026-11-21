/** Contact-form rules, shared by the browser (instant feedback) and the server action (the real check). Mirrors contact_messages' DB checks. */

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const isValidEmail = (v: string): boolean => v.length <= 254 && EMAIL_RE.test(v);

export const TOPICS = ["Safety and privacy", "My family's data", "Something is not working", "Something else"] as const;

export type ContactInput = { name: string; email: string; topic: string; message: string };
export type ContactField = "name" | "email" | "message";
export type ContactErrors = Partial<Record<ContactField, string>>;

/** Short label used in the summary list at the top of the form. */
export const SUMMARY_LABEL: Record<ContactField, string> = {
  name: "Your name is missing",
  email: "Check the email address",
  message: "Write a short message",
};

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  if (name.length < 1) errors.name = "Your name is missing";
  else if (name.length > 80) errors.name = "Please use 80 characters or fewer for your name";
  if (!isValidEmail(email)) errors.email = "Check the email address, it looks incomplete";
  if (message.length < 5) errors.message = "Write a short message so we can help";
  else if (message.length > 2000) errors.message = "Please keep your message under 2000 characters";
  return errors;
}
