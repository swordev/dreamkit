export type TypeContextOptions = { path?: string[] };

export class TypeContext<T extends Record<string, any> = {}> {
  readonly path: string[];
  constructor(readonly options: TypeContextOptions & T = {} as any) {
    this.path = options.path || [];
  }
  clone(key: string | number): this {
    return new (this.constructor as any)({
      ...this.options,
      path: [...this.path, key.toString()],
    }) as any;
  }
}
