#!/usr/bin/env node
// @ts-check
import { clean } from "./clean.js";
import { postinstall } from "./postinstall.js";

const [action, filter] = process.argv.slice(2);

if (action === "clean") {
  await clean(filter);
} else if (action === "postinstall") {
  await postinstall(filter);
} else {
  console.info("npx @dreamkit/workspace [clean|postinstall] [filter]");
  process.exit(1);
}
