declare module "dreamkit/definitions" {
  const $route: {
    params: (value: object) => typeof $route;
    path: (value: string | ((params: object) => string)) => typeof $route;
    preload: (
      value: (data: { intent: string; params: object }) => any,
    ) => typeof $route;
    create: (
      component: (utils: {
        params: object;
        setParams: (value: object) => void;
      }) => any,
    ) => typeof $route;
  };
}
