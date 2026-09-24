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

    const { sendFormNotification } = await import("@/lib/mailer.server");
    await sendFormNotification({
      subject: `New contact message from ${rest.name}`,
      text: [
        `Name: ${rest.name}`,
        `Email: ${rest.email}`,
        rest.phone ? `Phone: ${rest.phone}` : null,
        rest.inquiry_type ? `Inquiry type: ${rest.inquiry_type}` : null,
        rest.subject ? `Subject: ${rest.subject}` : null,
        is_prayer_request ? "This is also a prayer request." : null,
        "",
        rest.message,
      ]
        .filter((line) => line !== null)
        .join("\n"),
      replyTo: rest.email,
    });

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

    const { sendFormNotification } = await import("@/lib/mailer.server");
    await sendFormNotification({
      subject: `New visit plan from ${data.name}`,
      text: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        data.phone ? `Phone: ${data.phone}` : null,
        `Preferred contact: ${data.preferred_contact}`,
        `Adults: ${data.adults}, Children: ${data.children}`,
        data.accessibility_needs ? `Accessibility needs: ${data.accessibility_needs}` : null,
        data.accommodation_needs ? `Accommodation needs: ${data.accommodation_needs}` : null,
        data.prayer_request ? `Prayer request: ${data.prayer_request}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
      replyTo: data.email,
    });

    return { ok: true as const };
  });

const childSchema = z.object({
  parent_name: shortText.min(1),
  parent_email: email,
  parent_phone: shortText.optional().default(""),
  child_first_name: shortText.min(1),
  child_last_name: shortText.optional().default(""),
  child_age: z.coerce.number().int().min(0).max(25).nullable().default(null),
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

    const { sendFormNotification } = await import("@/lib/mailer.server");
    await sendFormNotification({
      subject: `New child registration: ${data.child_first_name}`,
      text: [
        `Child: ${data.child_first_name} ${data.child_last_name}`.trim(),
        data.child_age !== null ? `Age: ${data.child_age}` : null,
        `Parent: ${data.parent_name}`,
        `Parent email: ${data.parent_email}`,
        data.parent_phone ? `Parent phone: ${data.parent_phone}` : null,
        data.allergies ? `Allergies: ${data.allergies}` : null,
        data.medical_notes ? `Medical notes: ${data.medical_notes}` : null,
        data.special_needs ? `Special needs: ${data.special_needs}` : null,
        data.emergency_contact_name
          ? `Emergency contact: ${data.emergency_contact_name} ${data.emergency_contact_phone}`
          : null,
        data.authorized_pickup ? `Authorized pickup: ${data.authorized_pickup}` : null,
        `Photo consent: ${data.photo_consent ? "Yes" : "No"}`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
      replyTo: data.parent_email,
    });

    return { ok: true as const };
  });
