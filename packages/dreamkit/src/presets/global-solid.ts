import type { LinkComponent } from "@dreamkit/solid";
import type { Routing } from "dreamkit/presets/global.override.js";

export const Link: LinkComponent<Routing> = () => {
  throw new Error("Link component is not defined by the adapter");
};
