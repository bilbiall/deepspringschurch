import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const email = z.string().trim().email().max(255);
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(4000);
const honeypot = z.string().max(500).optional().default("");

function clean<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v])) as T;
}

const lines = (items: Array<string | null | false | undefined>) =>
  items.filter((line): line is string => typeof line === "string").join("\n");

const contactSchema = z.object({
  name: shortText.min(1),
  email,
  phone: shortText.optional().default(""),
  inquiry_type: shortText.optional().default(""),
  subject: shortText.optional().default(""),
  message: longText.min(1),
  is_prayer_request: z.boolean().default(false),
  company: honeypot,
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { company, ...rest } = data;
    if (company) return { ok: true as const };
    (await import("@/lib/rate-limit.server")).assertWithinRateLimit();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert(clean(rest));
    if (error) throw new Error("Your message could not be sent. Please try again.");

    if (rest.is_prayer_request) {
      await supabaseAdmin.from("prayer_requests").insert({
        name: rest.name,
        email: rest.email,
        request: rest.message,
        is_confidential: true,
      });
    }

    const { sendStaffNotification } = await import("@/lib/mailer.server");
    await sendStaffNotification({
      subject: rest.is_prayer_request
        ? `New prayer request from ${rest.name}`
        : `New contact message from ${rest.name}`,
      text: lines([
        `Name: ${rest.name}`,
        `Email: ${rest.email}`,
        rest.phone && `Phone: ${rest.phone}`,
        rest.inquiry_type && `Inquiry type: ${rest.inquiry_type}`,
        rest.subject && `Subject: ${rest.subject}`,
        rest.is_prayer_request && "This is a prayer request. Please treat it confidentially.",
        "",
        rest.message,
        "",
        "You can reply to this email to reach the sender. It is also saved in the admin dashboard.",
      ]),
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
  botcheck: honeypot,
});

export const submitVisitPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => visitSchema.parse(data))
  .handler(async ({ data }) => {
    const { botcheck, ...rest } = data;
    if (botcheck) return { ok: true as const };
    (await import("@/lib/rate-limit.server")).assertWithinRateLimit();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("visit_plans").insert(clean(rest));
    if (error) throw new Error("We could not save your details. Please try again.");

    if (rest.prayer_request) {
      await supabaseAdmin.from("prayer_requests").insert({
        name: rest.name,
        email: rest.email,
        request: rest.prayer_request,
      });
    }

    const { sendStaffNotification } = await import("@/lib/mailer.server");
    await sendStaffNotification({
      subject: rest.prayer_request
        ? `New visit plan (with prayer request) from ${rest.name}`
        : `New visit plan from ${rest.name}`,
      text: lines([
        `Name: ${rest.name}`,
        `Email: ${rest.email}`,
        rest.phone && `Phone: ${rest.phone}`,
        `Preferred contact: ${rest.preferred_contact}`,
        `Adults: ${rest.adults}, Children: ${rest.children}`,
        rest.accessibility_needs && `Accessibility needs: ${rest.accessibility_needs}`,
        rest.accommodation_needs && `Accommodation needs: ${rest.accommodation_needs}`,
        rest.prayer_request && `Prayer request: ${rest.prayer_request}`,
        "",
        "You can reply to this email to reach the visitor. It is also saved in the admin dashboard.",
      ]),
      replyTo: rest.email,
    });

    return { ok: true as const };
  });

// The public form uses one "child name" box and one "emergency contact" box,
// plus a few free-text notes; these are mapped onto the table's columns below.
const childSchema = z.object({
  parent_name: shortText.min(1),
  parent_email: email,
  parent_phone: shortText.optional().default(""),
  emergency_contact: shortText.optional().default(""),
  child_name: shortText.min(1),
  child_age: z.coerce.number().int().min(0).max(25).nullable().default(null),
  allergies: longText.optional().default(""),
  medical_information: longText.optional().default(""),
  accommodation_needs: longText.optional().default(""),
  sensory_needs: longText.optional().default(""),
  additional_information: longText.optional().default(""),
  botcheck: honeypot,
});

export const submitChildRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => childSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.botcheck) return { ok: true as const };
    (await import("@/lib/rate-limit.server")).assertWithinRateLimit();

    const [first = "", ...restName] = data.child_name.split(/\s+/);
    const specialNeeds = lines([
      data.accommodation_needs && `Accommodation: ${data.accommodation_needs}`,
      data.sensory_needs && `Sensory: ${data.sensory_needs}`,
      data.additional_information && `Additional: ${data.additional_information}`,
    ]);

    const row = clean({
      parent_name: data.parent_name,
      parent_email: data.parent_email,
      parent_phone: data.parent_phone,
      child_first_name: first,
      child_last_name: restName.join(" "),
      child_age: data.child_age,
      allergies: data.allergies,
      medical_notes: data.medical_information,
      special_needs: specialNeeds,
      emergency_contact_name: data.emergency_contact,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("child_registrations").insert(row);
    if (error) throw new Error("Registration could not be saved. Please try again.");

    const { sendStaffNotification } = await import("@/lib/mailer.server");
    await sendStaffNotification({
      subject: `New child registration: ${data.child_name}`,
      text: lines([
        `Child: ${data.child_name}`,
        data.child_age !== null && `Age: ${data.child_age}`,
        `Parent: ${data.parent_name}`,
        `Parent email: ${data.parent_email}`,
        data.parent_phone && `Parent phone: ${data.parent_phone}`,
        data.emergency_contact && `Emergency contact: ${data.emergency_contact}`,
        data.allergies && `Allergies: ${data.allergies}`,
        data.medical_information && `Medical information: ${data.medical_information}`,
        specialNeeds && specialNeeds,
        "",
        "You can reply to this email to reach the parent. It is also saved in the admin dashboard.",
      ]),
      replyTo: data.parent_email,
    });

    return { ok: true as const };
  });
