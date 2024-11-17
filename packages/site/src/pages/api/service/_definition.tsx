declare module "dreamkit/definitions" {
  const ServiceClass: {
    (iocParams: object): {
      new (): {
        onStart(): (() => any) | undefined;
        onStop(): any;
      };
    };
  };
}
