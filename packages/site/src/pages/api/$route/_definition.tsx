import type { Component } from "solid-js";

declare module "dreamkit/definitions" {
  const $route: {
    title(value: string): typeof $route;
    params(value: object): typeof $route;
    onParamsError(input: { value: any } | { redirect: string }): typeof $route;
    path(value: string | ((params: object) => string)): typeof $route;
    api(value: Record<string, Function>): typeof $route;
    preload(
      value: (data: { intent: string; params: object }) => any,
    ): typeof $route;
    create(
      component: (utils: {
        params: object;
        setParams: (value: object) => void;
        api: Record<string, Function>;
      }) => any,
    ): Component;
  };
}
