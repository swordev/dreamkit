declare const ServiceClass: {
  (iocParams: object): {
    new (): {
      onStart(): (() => any) | undefined;
      onStop(): any;
    };
  };
};
