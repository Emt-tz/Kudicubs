export type ChildFormValues = { nickname: string; ageBand: string; region: string; avatar: string };
export type ChildFormErrors = Partial<Record<"nickname" | "ageBand" | "region" | "avatar" | "form", string>>;
export type ChildFormState = { values: ChildFormValues; errors: ChildFormErrors } | null;

export type PinFormErrors = Partial<Record<"current" | "next" | "confirm" | "form", string>>;
export type PinFormState = { errors: PinFormErrors } | null;

export type SimpleFormState = { ok: boolean; message: string } | null;
