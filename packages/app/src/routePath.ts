import { createRouteHref } from "./utils/routing.js";

export type RoutePathFunc<T> = {
  <K extends keyof T>(
    path: K,
    ...data: T[K] extends never ? [] : [data: T[K]]
  ): string;
};

/*#__NO_SIDE_EFFECTS__*/
export function defineRoutePath<T>(): RoutePathFunc<T> {
  return function <P extends keyof T>(input: P, ...data: any[]) {
    return createRouteHref(input as string, (data as any)[0]);
  };
}

export const routePath = defineRoutePath();
