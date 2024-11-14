export type ExpandObject<T> = { [K in keyof T]: T[K] } & {};

export type Merge<
  Shape,
  T1 extends Shape,
  T2 extends Partial<Shape>,
> = ExpandObject<Omit<T1, keyof T2> & T2>;

export type TryPick<T, K, V = undefined> = K extends keyof T ? T[K] : V;

export type Any<T> = T & string;

export {};
