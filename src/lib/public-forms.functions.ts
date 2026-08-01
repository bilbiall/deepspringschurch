import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const email = z.string().trim().email().max(255);
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(4000);

function clean<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]),
  ) as T;
}

const contactSchema = z.object({
  name: shortText.min(1),
  email,
  phone: shortText.optional().default(""),
  inquiry_type: shortText.optional().default(""),
  subject: shortText.optional().default(""),
  message: longText.min(1),
  is_prayer_request: z.boolean().default(false),
  company: z.string().max(0).optional().default(""),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { company, is_prayer_request, ...rest } = data;
    if (company) return { ok: true as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("contact_messages")
      .insert(clean({ ...rest, is_prayer_request }));
    if (error) throw new Error("Your message could not be sent. Please try again.");

    if (is_prayer_request) {
      await supabaseAdmin.from("prayer_requests").insert({
        name: rest.name,
        email: rest.email,
        request: rest.message,
        is_confidential: true,
      });
    }
    return { ok: true as const };
  });

const visitSchema = z.object({
  name: shortText.min(1),
  email,
  phone: shortText.optional().default(""),
  preferred_contact: shortText.optional().default("email"),
  adults: z.coerce.number().int().min(0).max(50).default(1),
  children: z.coerce.number().int().min(0).max(50).default(0),
  accessibility_needs: longText.optional().default(""),
  accommodation_needs: longText.optional().default(""),
  prayer_request: longText.optional().default(""),
});

export const submitVisitPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => visitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("visit_plans").insert(clean(data));
    if (error) throw new Error("We could not save your details. Please try again.");
    if (data.prayer_request) {
      await supabaseAdmin.from("prayer_requests").insert({
        name: data.name,
        email: data.email,
        request: data.prayer_request,
      });
    }
    return { ok: true as const };
  });

const childSchema = z.object({
  parent_name: shortText.min(1),
  parent_email: email,
  parent_phone: shortText.optional().default(""),
  child_first_name: shortText.min(1),
  child_last_name: shortText.optional().default(""),
  child_age: z.coerce.number().int().min(0).max(25).optional(),
  allergies: longText.optional().default(""),
  medical_notes: longText.optional().default(""),
  special_needs: longText.optional().default(""),
  emergency_contact_name: shortText.optional().default(""),
  emergency_contact_phone: shortText.optional().default(""),
  authorized_pickup: longText.optional().default(""),
  photo_consent: z.boolean().default(false),
});

export const submitChildRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => childSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("child_registrations").insert(clean(data));
    if (error) throw new Error("Registration could not be saved. Please try again.");
    return { ok: true as const };
  });
