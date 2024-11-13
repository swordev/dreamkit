export type ExpandObject<T> = { [K in keyof T]: T[K] } & {};

export type Merge<
  Shape,
  T1 extends Shape,
  T2 extends Partial<Shape>,
> = ExpandObject<Omit<T1, keyof T2> & T2>;

export type Constructor<T = any> = { new (...args: any[]): T };

export {};
