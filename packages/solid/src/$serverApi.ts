import {
  $api,
  App,
  isSession,
  ResponseHeaders,
  SessionHandler,
} from "@dreamkit/app";
import { normalizeIocParams } from "@dreamkit/ioc";
import { getRequestEvent } from "solid-js/web";

export const $serverApi = $api["clone"]({
  context: () => {
    const app = App.instance();
    const event = getRequestEvent()!;
    const context = app.createRequestContext(event.request);
    context.register(ResponseHeaders, {
      value: event.response.headers,
    });
    return context;
  },
  onCall: async (options, { callback, context, params }) => {
    const iocParams = normalizeIocParams(options.self || {});
    for (const [, param] of Object.entries(iocParams)) {
      const value = param.options.key ?? param.options.value;
      if (isSession(value)) {
        const sessionParams = await context.resolve(SessionHandler).get(value);
        if (sessionParams)
          context.register(value, {
            value: new value(sessionParams),
          });
      }
    }
    const self = context.resolveParams(options.self || {});
    return callback.bind(self)(params);
  },
});
