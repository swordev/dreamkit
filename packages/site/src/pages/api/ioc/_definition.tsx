declare module "dreamkit/definitions" {
  const context: {
    register(
      key: any,
      data: {
        value?: any;
        useClass?: any;
        useFactory?: ($context: typeof context, key: any) => any;
        singleton?: boolean;
      },
    ): typeof context;
    unregister(key: any): typeof context;
    resolve(key: any): unknown;
    fork(): typeof context;
  };
}
