import { $api, App } from "@dreamkit/app";
import { getRequestEvent } from "solid-js/web";

export const $serverApi = $api["clone"]({
  context: () => {
    const app = App.instance();
    const event = getRequestEvent()!;
    return app.createRequestContext(event.request);
  },
});
