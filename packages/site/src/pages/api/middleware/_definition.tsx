declare module "dreamkit/definitions" {
  const MiddlewareClass: {
    (iocParams: object): {
      new (): {
        onRequest(): Response | undefined;
      };
    };
  };
}
