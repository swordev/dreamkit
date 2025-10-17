import { defineRoutePath, RequestUrl as BaseRequestUrl } from "@dreamkit/core";
import type { Routing } from "dreamkit/scopes/global.override.js";

export const routePath = defineRoutePath<Routing>();
export class RequestUrl extends BaseRequestUrl<Routing> {}
