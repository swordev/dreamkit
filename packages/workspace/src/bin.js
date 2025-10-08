#!/usr/bin/env node
// @ts-check
import { clean } from "./actions/clean.js";
import { init } from "./actions/init.js";
import { postinstall } from "./actions/postinstall.js";

const [action, filter] = process.argv.slice(2);

if (action === "init") {
  await init();
} else if (action === "clean") {
  await clean(filter);
} else if (action === "postinstall") {
  await postinstall(filter);
} else {
  console.info("npx @dreamkit/workspace [init|clean|postinstall] [filter]");
  process.exit(1);
}
