declare module "dreamkit/definitions" {
  const $service: {
    self(value: object): typeof $service;
    create(): {
      new (): {
        onStart(): (() => any) | undefined;
        onStop(): any;
      };
    };
  };
}
