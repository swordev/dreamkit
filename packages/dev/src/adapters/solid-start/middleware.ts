import { App } from "@dreamkit/app";
import { type HTTPEvent, getWebRequest, sendWebResponse } from "vinxi/http";

export default {
  onRequest: [
    async (event: HTTPEvent) => {
      const app = App.instance();
      const request = getWebRequest(event);
      const response = await app.request(request);
      if (response) await sendWebResponse(event, response);
    },
  ],
};
