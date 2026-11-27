import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processAudio, processAutoRenewals } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processAudio, processAutoRenewals]
});