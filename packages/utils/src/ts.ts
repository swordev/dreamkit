export type Obj = Record<string, any>;

export type ExpandObject<T> = { [K in keyof T]: T[K] } & {};

export type Merge<
  Shape,
  T1 extends Shape,
  T2 extends Partial<Shape>,
> = ExpandObject<Omit<T1, keyof T2> & T2>;

export type Constructor<T = any> = { new (...args: any[]): T };

export type If<V, C1, C2 = C1> = [V] extends [true] ? C1 : C2;

export type Any<T> = T & string;
export type TryPick<T, Keys extends string> = {
  [K in Keys as K extends keyof T ? K : never]: K extends keyof T
    ? T[K]
    : never;
};
export {};
