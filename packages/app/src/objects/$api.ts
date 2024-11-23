import { ApiBuilder, kindApi } from "../builders/ApiBuilder.js";

export const $api = /*#__PURE__*/ new ApiBuilder({})["clone"]({
  onCreate: (func) => {
    kindApi(func);
    return func;
  },
});
