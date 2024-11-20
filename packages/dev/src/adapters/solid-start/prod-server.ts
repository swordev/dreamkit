import { App } from "@dreamkit/app";
// @ts-ignore
import * as objects from "dk:entry";
// @ts-ignore
import * as preEntries from "dk:pre-entries";

export default async function (_nitro: any) {
  const app = App.createGlobalInstance();
  for (const id in preEntries) await app.add(preEntries[id]);
  await app.add(objects);
  await app.start();
}
