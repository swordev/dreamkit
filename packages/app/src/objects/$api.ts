import { ApiBuilder } from "../builders/ApiBuilder.js";
import { Func } from "@dreamkit/func";
import { createIsKind, kind } from "@dreamkit/kind";

const tag = "@dreamkit/app/api";
export const isApi = createIsKind<Func>(tag);

export const $api = /*#__PURE__*/ new ApiBuilder({})["clone"]({
  onCreate: (func) => {
    kind(func, tag);
    return func;
  },
});
