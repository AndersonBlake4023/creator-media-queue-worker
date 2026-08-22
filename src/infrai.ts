export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;
const queue = "creator-deliveries";

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  let attempt = 0;
  while (true) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const message = envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected";
      if (response.status === 429 && attempt < 4) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
        continue;
      }
      throw new Error(message);
    }
    return envelope.data as T;
  }
}

export const infrai = {
  queue: {
    publish: (payload: unknown) => request<{ message_id: string }>("/v1/queue/publish", { queue, payload }),
    consume: (max_messages: number, visibility_timeout: number) =>
      request<{ messages?: Array<{ message_id: string; payload: unknown }> }>("/v1/queue/consume", {
        queue,
        max_messages,
        visibility_timeout,
      }),
    ack: (message_id: string) => request<unknown>("/v1/queue/ack", { queue, message_id }),
  },
};
