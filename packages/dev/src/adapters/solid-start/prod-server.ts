import { App } from "@dreamkit/app";
// @ts-ignore
import * as objects from "dk:entry";
// @ts-ignore
import * as presets from "dk:presets";

export default async function (_nitro: any) {
  const app = App.createGlobalInstance();
  for (const id in presets) await app.add(presets[id]);
  await app.add(objects);
  await app.start();
}
