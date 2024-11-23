declare module "dreamkit/definitions" {
  const $middleware: {
    self(value: object): typeof $middleware;
    create(): {
      new (): {
        onRequest(): Response | undefined;
      };
    };
  };
}
