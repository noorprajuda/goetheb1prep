import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "speaking-test-app",
  eventKey: process.env.INNGEST_EVENT_KEY, // Optional - will work without it in development
});