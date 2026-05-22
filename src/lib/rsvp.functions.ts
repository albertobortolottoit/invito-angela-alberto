import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const rsvpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  attending: z.boolean(),
  guests: z.number().int().min(0).max(10),
  dietary: z.string().trim().max(500).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
});

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => rsvpSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("rsvps").insert({
      name: data.name,
      email: data.email,
      attending: data.attending,
      guests: data.guests,
      dietary: data.dietary || null,
      message: data.message || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
