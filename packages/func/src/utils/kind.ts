import type { Func } from "../types.js";
import { createKind } from "@dreamkit/kind";

export const [kindFunc, isFunc] = createKind<Func>("@dreamkit/func");
