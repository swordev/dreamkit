import { App } from "@dreamkit/app";
// @ts-ignore
import * as objects from "dk:entry";

export default async function (_nitro: any) {
  const app = new App();
  App.saveInstance(app);
  await app.add(objects);
  await app.start();
}
