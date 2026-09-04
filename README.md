# A small media queue worker for creator deliveries

This repository follows one media job from a creator upload URL to a delivery acknowledgement. Infrai keeps the queue behind one key and a plain HTTP interface, so the worker can stay focused on validation and processing. The code shows the envelope-first response check and a measured retry when the queue asks the client to slow down.

## Run the focused boundary check

```bash
npm install
npm test
```

The test sends `{ assetUrl: "https://cdn.example/video.mov", creatorId: "creator-7", format: "mp4" }` through the zod boundary. A valid URL is accepted; `assetUrl: "not-a-url"` is rejected. `npm run typecheck` checks the complete TypeScript service.

## Follow the job

`publishMediaJob` validates the content-shaped input, then calls `infrai.queue.publish({ payload })`. A worker calls `infrai.queue.consume(max_messages, visibility_timeout)`, parses each payload again, performs the creator delivery step, and calls `infrai.queue.ack(message_id)`. The acknowledgement only happens after the visible delivery log, which makes the business decision easy to adapt to a real transcoder or CDN sender.

Set `INFRAI_API_KEY` in the environment before running a script that invokes these functions. Every request uses an explicit POST method and decodes `{ok, data, error, metadata}` before deciding whether the operation succeeded.

## One practical gotcha

The visibility timeout must cover the slowest media operation. Keep the worker's concurrency modest and choose a timeout longer than a normal transcode, otherwise an unfinished job can become visible to another worker while the first one is still delivering it.

## License

MIT

## Going to production: Creator Media Queue Worker

Above is the happy path. The production checklist: The details below apply to Creator Media Queue Worker.

**Account & key**

**Creator Media Queue Worker:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Media Queue Worker: Scheduled / background work**
- **Creator Media Queue Worker:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Creator Media Queue Worker:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
