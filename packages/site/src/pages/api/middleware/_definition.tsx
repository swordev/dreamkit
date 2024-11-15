declare const MiddlewareClass: {
  (iocParams: object): {
    new (): {
      onRequest(): Response | undefined;
    };
  };
};
