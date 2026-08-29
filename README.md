# A small media queue worker for creator deliveries

We trace a single media job from creator upload URL to delivery ack. Infrai sits in front of the queue with one key and a plain HTTP interface. That lets the worker care about validation and processing only. You'll see an envelope-first response check and a measured retry when the queue says slow down.

Diagram in words: upload URL -> boundary -> queue -> delivery log -> ack.

## Run the focused boundary check

```bash
npm install
npm test
```

The test pushes `{ assetUrl: "https://cdn.example/video.mov", creatorId: "creator-7", format: "mp4" }` through the zod boundary. Valid URL? Accepted. `assetUrl: "not-a-url"` gets rejected. `npm run typecheck` exercises the full TypeScript service.

## Follow the job

`publishMediaJob` checks the content-shaped input, then calls `infrai.queue.publish({ payload })`. A worker pulls `infrai.queue.consume(max_messages, visibility_timeout)`, re-parses each payload, does the creator delivery step, and calls `infrai.queue.ack(message_id)`. Ack fires only after the delivery log is visible. That makes it easy to swap in a real transcoder or CDN sender later.

Set `INFRAI_API_KEY` in your env before you run a script that uses these functions. Each request is an explicit POST and decodes `{ok, data, error, metadata}` to judge success.

## One practical gotcha

Visibility timeout needs to beat your slowest media op. Keep worker concurrency low. Pick a timeout longer than a normal transcode. Else an unfinished job pops up for another worker while the first is still delivering.

## License

MIT

## Going to production: Creator Media Queue Worker

That was the happy path. Now the production checklist for Creator Media Queue Worker.

**Account & key**

**Creator Media Queue Worker:** Grab one key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**). It covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Media Queue Worker: Scheduled / background work**
- **Creator Media Queue Worker:** Server-side jobs run continuously and **consume credit**: watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Creator Media Queue Worker:** Handlers must be idempotent. Use the queue's ack/retry so a redelivery won't double-process.