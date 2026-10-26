import assert from "node:assert/strict";
import { buildEngineReply } from "../lib/engine.js";

assert.equal(buildEngineReply("hello"), "Engine response for: hello");
assert.equal(buildEngineReply("   "), "Please provide a message to continue.");

console.log("engine tests passed");
