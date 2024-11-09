import type { App } from "../App.js";
import type { Route } from "../builders/RouteBuilder.js";
import { createKind } from "@dreamkit/kind";

export const [kindApp, isApp] = createKind<App>("@dreamkit/app");
export const [kindRoute, isRoute] = createKind<Route>("@dreamkit/app/route");
