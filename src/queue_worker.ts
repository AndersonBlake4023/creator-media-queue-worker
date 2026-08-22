import { z } from "zod";
import { infrai } from "./infrai.ts";

export const mediaJob = z.object({
  assetUrl: z.string().url(),
  creatorId: z.string().min(1),
  format: z.enum(["mp4", "webm"]),
});

export type MediaJob = z.infer<typeof mediaJob>;

export async function publishMediaJob(job: MediaJob): Promise<string> {
  const parsed = mediaJob.parse(job);
  const result = await infrai.queue.publish(parsed);
  return result.message_id;
}

export async function drainMediaJobs(maxMessages = 2): Promise<string[]> {
  const result = await infrai.queue.consume(maxMessages, 60);
  const completed: string[] = [];
  for (const message of result.messages ?? []) {
    const job = mediaJob.parse(message.payload);
    console.log(`deliver ${job.format} for creator ${job.creatorId}: ${job.assetUrl}`);
    await infrai.queue.ack(message.message_id);
    completed.push(message.message_id);
  }
  return completed;
}
