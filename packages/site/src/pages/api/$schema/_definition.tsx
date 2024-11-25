declare module "dreamkit/definitions" {
  class Type {
    title(value: string): this;
    nullable(): this;
    optional(): this;
    nullish(): this;
    required(): this;
    validate(input: any): any[];
    test(input: any): boolean;
    assert(input: any): asserts input is any;
    toJsonSchema(): any;
  }
  const $schema: {
    title(value: string): typeof $schema;
    object(props: Record<string, Type>): Type & {
      props: Record<string, Type>;
      findProp(name: string): Type | undefined;
      findPropOrFail(name: string): Type;
      pick(mask: Record<string, boolean>): Type;
      omit(mask: Record<string, boolean>): Type;
      assign(props: Record<string, Type>): Type;
      require(mask?: Record<string, boolean>): Type;
      deepPartial(self?: boolean): Type;
      deepRequired(self?: boolean): Type;
      deepNullish(self?: boolean): Type;
    };
    array(type: Type): Type & {
      min(value: number): Type;
      max(value: number): Type;
    };
    string(): Type & {
      min(value: number): Type;
      max(value: number): Type;
      length(value: number): Type;
    };
    number(): Type & {
      min(value: number): Type;
      max(value: number): Type;
      integer(): Type;
    };
    bool(): Type;
    file(): Type & {
      ext(value: string[]): Type;
      min(value: number | `${number}mb`): Type;
      max(value: number | `${number}mb`): Type;
    };
  };

  const s: typeof $schema;
}
