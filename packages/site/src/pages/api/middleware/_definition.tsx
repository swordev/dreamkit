declare const MiddlewareClass: {
  (self: object): {
    new (): {
      onRequest(): Response | undefined;
    };
  };
};
