import type { App } from "../App.js";
import type { Route, RouteBuilder } from "../builders/RouteBuilder.js";
import { createKind } from "@dreamkit/kind";

export const [kindApp, isApp] = createKind<App>("@dreamkit/app");
export const [kindRoute, isRoute] = createKind<Route>("@dreamkit/app/route");
export const [kindRouteBuilder, isRouteBuilder] = createKind<RouteBuilder>(
  "@dreamkit/app/RouteBuilder",
);
