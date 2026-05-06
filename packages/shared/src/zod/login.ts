import { z } from "zod";

import { normalizeIsraelPhoneToE164 } from "../utils/phone";

export const loginFormSchema = z
  .object({
    phone: z.string().min(1, "נא להזין מספר טלפון"),
    password: z.string().min(6),
  })
  .superRefine((data, ctx) => {
    if (!normalizeIsraelPhoneToE164(data.phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "מספר טלפון לא תקין",
        path: ["phone"],
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
