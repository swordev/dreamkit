export type Constructor<A extends any[] = any[], I = any> = new (
  ...args: A
) => I;
export type AbstractConstructor<
  A extends any[] = any[],
  I = any,
> = abstract new (...args: A) => I;
export type ConstructorArg<T extends AbstractConstructor> =
  ConstructorParameters<T>[0];
export type AnyFunction = (...args: any[]) => any;
export type ObjectToArray<T> = keyof T extends never ? [] : [T];
export type TryUncapitalize<T> = T extends string ? Uncapitalize<T> : T;
export type PickByValue<T, V> = {
  [k in keyof T as T[k] extends V ? k : never]: T[k];
};

export type ExpandObject<T> = { [K in keyof T]: T[K] } & {};
export type Merge<
  Shape,
  T1 extends Shape,
  T2 extends Partial<Shape>,
> = ExpandObject<Omit<T1, keyof T2> & T2>;

export {};
