import { $api, App, ResponseHeaders } from "@dreamkit/app";
import { getRequestEvent } from "solid-js/web";

export const $serverApi = $api["clone"]({
  onCall: async ({ callback, params, options }) => {
    const event = getRequestEvent()!;
    const self = await App.instance()
      .createRequestContext(event.request)
      .register(ResponseHeaders, { value: event.response.headers })
      .resolveAsyncParams(options.self);
    return callback.bind(self)(params);
  },
});
