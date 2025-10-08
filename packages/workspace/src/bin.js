#!/usr/bin/env node
// @ts-check
import { clean } from "./actions/clean.js";
import { gen } from "./actions/gen.js";
import { init } from "./actions/init.js";

const [action, filter] = process.argv.slice(2);

if (action === "init") {
  await init();
} else if (action === "clean") {
  await clean(filter);
} else if (action === "gen" || action === "postinstall") {
  await gen(filter);
} else {
  console.info(
    "npx @dreamkit/workspace [init|clean|(gen|postinstall)] [filter]",
  );
  process.exit(1);
}
