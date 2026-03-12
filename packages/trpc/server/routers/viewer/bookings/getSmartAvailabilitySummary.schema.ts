import { z } from "zod";

export const ZGetSmartAvailabilitySummaryInputSchema = z.object({
  startOfWeek: z.string().optional(),
  endOfWeek: z.string().optional(),
  timeZone: z.string().optional(),
  includeRawAvailability: z.boolean().optional().default(false),
  refresh: z.boolean().optional().default(false),
});

export type TGetSmartAvailabilitySummaryInputSchema = z.infer<
  typeof ZGetSmartAvailabilitySummaryInputSchema
>;
