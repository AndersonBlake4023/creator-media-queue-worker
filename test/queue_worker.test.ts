import assert from "node:assert/strict";
import { mediaJob } from "../src/queue_worker.ts";

const accepted = mediaJob.safeParse({ assetUrl: "https://cdn.example/video.mov", creatorId: "creator-7", format: "mp4" });
assert.equal(accepted.success, true);
const rejected = mediaJob.safeParse({ assetUrl: "not-a-url", creatorId: "creator-7", format: "mp4" });
assert.equal(rejected.success, false);
console.log("media job boundary: accepted valid asset, rejected malformed URL");
