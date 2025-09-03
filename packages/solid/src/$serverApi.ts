import { $api, App, ResponseHeaders } from "@dreamkit/app";
import { getRequestEvent } from "solid-js/web";

export const $serverApi = $api["clone"]({
  onCall: async ({ callback, params }) => {
    const event = getRequestEvent()!;
    const $callback = await App.instance()
      .createRequestContext(event.request)
      .register(ResponseHeaders, { value: event.response.headers })
      .resolveAsync(callback);
    return $callback(params);
  },
});
