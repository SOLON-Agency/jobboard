import { z } from "zod";

export const WITHDRAW_REASON_MIN = 10;
export const WITHDRAW_REASON_MAX = 1000;

export const withdrawApplicationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(
      WITHDRAW_REASON_MIN,
      `Motivul trebuie să conțină cel puțin ${WITHDRAW_REASON_MIN} caractere.`
    )
    .max(
      WITHDRAW_REASON_MAX,
      `Motivul nu poate depăși ${WITHDRAW_REASON_MAX} caractere.`
    ),
});

export type WithdrawApplicationFormData = z.infer<
  typeof withdrawApplicationSchema
>;
