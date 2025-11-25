import {
  MinimalObjectType,
  ObjectType,
  ObjectTypeProps,
} from "../types/ObjectType.js";
import * as $ from "./../types/utils.js";
import { Any, If } from "@dreamkit/utils/ts.js";

export type ConvertType<
  T extends $.MinimalType,
  F extends $.TypeFlag.Name,
> = F extends keyof T
  ? T[F] extends () => $.MinimalType
    ? ReturnType<T[F]>
    : T
  : T;

export type ConvertObjectType<
  T extends MinimalObjectType,
  Mask extends {
    [k in keyof T["props"]]?: true;
  },
  F extends $.TypeFlag.Name,
> = T extends object
  ? ObjectType<
      {
        [K in keyof T["props"]]: K extends keyof Mask
          ? Mask[K] extends true
            ? ConvertType<T["props"][K], F>
            : T["props"][K]
          : T["props"][K];
      },
      T["flagsValue"]
    >
  : never;

export type ObjectTypeMask<Props extends ObjectTypeProps, V = true> = {
  [K in keyof Props]?: Props[K] extends MinimalObjectType<infer Subprops>
    ? ObjectTypeMask<Subprops> | V
    : V;
} & {};

export type DeepProjectObjectType<
  T extends MinimalObjectType,
  Input,
  Include = true,
  TProps extends ObjectTypeProps = T["props"],
> =
  unknown extends Any<T>
    ? ObjectType
    : ObjectType<
        {
          [K in keyof TProps as K extends keyof Input
            ? true extends Input[K]
              ? If<Include, K, never>
              : Input[K] extends Record<string, any>
                ? TProps[K] extends MinimalObjectType
                  ? K
                  : If<Include, never>
                : If<Include, never, K>
            : If<Include, never, K>]: K extends keyof Input
            ? true extends Input[K]
              ? If<Include, TProps[K], never>
              : Input[K] extends Record<string, any>
                ? TProps[K] extends MinimalObjectType
                  ? DeepProjectObjectType<TProps[K], Input[K], Include>
                  : If<Include, never>
                : If<Include, never, TProps[K]>
            : If<Include, never, TProps[K]>;
        },
        T["flagsValue"]
      >;

export type DeepMergeFlags<
  T extends $.MinimalType,
  F extends $.TypeFlag.Name,
  Q = undefined,
  Self extends boolean = false,
> = F extends keyof T
  ? T extends MinimalObjectType
    ? ObjectType<
        {
          [K in keyof T["props"]]: T["props"][K] extends MinimalObjectType
            ? DeepMergeFlags<T["props"][K], F, Q, true>
            : $.TypeFlag.CheckTypeFlags<
                  Q,
                  T["props"][K]["flagsValue"]
                > extends never
              ? T["props"][K]
              : DeepMergeFlags<T["props"][K], F, Q, true>;
        },
        [Self] extends [true]
          ? $.TypeFlag.Merge<T["flagsValue"], $.TypeFlag.Object[F]>
          : T["flagsValue"]
      >
    : T[F] extends () => $.MinimalType
      ? ReturnType<T[F]>
      : T
  : T;

export type AssignAndMergeObjectType<
  T1 extends $.MinimalType,
  T2 extends $.MinimalType,
> = T1 extends MinimalObjectType
  ? T2 extends MinimalObjectType
    ? AssignObjectType<T1, T2["props"], true>
    : T2
  : T2;

export type AssignObjectType<
  T1 extends MinimalObjectType,
  T2 extends AssignInput,
  Merge = false,
> = T1 extends MinimalObjectType
  ? ObjectType<
      {
        [K in keyof T2 | keyof T1["props"]]: K extends keyof T2
          ? T2[K] extends $.MinimalType
            ? [Merge] extends [true]
              ? K extends keyof T1["props"]
                ? T1["props"][K] extends $.MinimalType
                  ? AssignAndMergeObjectType<T1["props"][K], T2[K]>
                  : T2[K]
                : T2[K]
              : T2[K]
            : T2[K] extends AssignInput
              ? AssignObjectType<
                  K extends keyof T1["props"]
                    ? T1["props"][K] extends MinimalObjectType
                      ? T1["props"][K]
                      : ObjectType<{}>
                    : ObjectType<{}>,
                  T2[K],
                  Merge
                >
              : never
          : K extends keyof T1["props"]
            ? T1["props"][K]
            : never;
      },
      T1["flagsValue"]
    >
  : never;

export type AssignInput = {
  [K: string]: $.MinimalType | AssignInput;
};

export {};
