declare const ServiceClass: {
  (self: object): {
    new (): {
      onStart(): undefined | (() => any);
      onStop(): any;
    };
  };
};
