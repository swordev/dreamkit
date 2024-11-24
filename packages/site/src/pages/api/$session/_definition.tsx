declare module "dreamkit/definitions" {
  const $session: {
    name(value: string): typeof $session;
    params(value: object): typeof $session;
    timelife(value: { minutes?: number; days?: number }): typeof $session;
    create(): {
      new (params: object): {
        params: object;
      };
    };
  };
}
