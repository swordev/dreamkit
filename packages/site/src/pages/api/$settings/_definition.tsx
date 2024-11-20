declare module "dreamkit/definitions" {
  const $settings: {
    name(value: string): typeof $settings;
    params(value: object): typeof $settings;
    optional(value?: boolean): typeof $settings;
    defaults(cb: (params: object) => object): typeof $settings;
    generate(cb: (unsafeParams: object) => object): typeof $settings;
    create(): {
      new (params: object): {
        params: object;
      };
    };
  };
}
