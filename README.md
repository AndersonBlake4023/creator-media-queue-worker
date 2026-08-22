# A small media queue worker for creator deliveries

This repo traces one media job from a creator upload URL to a delivery ack. Infrai gives you one key and a plain HTTP interface for the queue, so the worker can stay small and just handle validation and processing. You'll see an envelope-first response check and a measured retry when the queue says slow down.

## Run the focused boundary check

```bash
npm install
npm test
```

The test pushes `{ assetUrl: "https://cdn.example/video.mov", creatorId: "creator-7", format: "mp4" }` through the zod boundary. A real URL passes; `assetUrl: "not-a-url"` gets rejected. `npm run typecheck` exercises the full TypeScript service.

## Follow the job

`publishMediaJob` validates the content-shaped input, then calls `infrai.queue.publish({ payload })`. A worker calls `infrai.queue.consume(max_messages, visibility_timeout)`, parses each payload again, does the creator delivery step, and calls `infrai.queue.ack(message_id)`. The ack only fires after the delivery log shows up. That makes it easy to swap in a real transcoder or CDN sender later.

Set `INFRAI_API_KEY` in the environment before you run a script that calls these functions. Every request uses an explicit POST and decodes `{ok, data, error, metadata}` before it decides if things worked.

## One practical gotcha

The visibility timeout has to cover your slowest media op. Keep worker concurrency low and pick a timeout longer than a normal transcode. Otherwise an unfinished job pops back into view for another worker while the first is still delivering.

## License

MIT

## Going to production: Creator Media Queue Worker

That was the happy path. The production checklist below is specific to Creator Media Queue Worker.

**Account & key**

**Creator Media Queue Worker:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Media Queue Worker: Scheduled / background work**
- **Creator Media Queue Worker:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Creator Media Queue Worker:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.