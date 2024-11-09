import { createRouteHref } from "@dreamkit/app/utils/routing.js";
import { A, type AnchorProps } from "@solidjs/router";
import {
  ComponentProps,
  createComponent,
  JSXElement,
  mergeProps,
  splitProps,
} from "solid-js";

type PickRequiredProps<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};

export type LinkProps<T, P extends keyof T> = Omit<AnchorProps, "href"> & {
  href: P;
} & (T[P] extends never
    ? {}
    : keyof PickRequiredProps<T[P]> extends never
      ? { params?: T[P] }
      : { params: T[P] });

export type LinkComponent<T> = <P extends keyof T>(
  inProps: LinkProps<T, P>,
) => JSXElement;

/*#__NO_SIDE_EFFECTS__*/
export function defineLink<T>(): LinkComponent<T> {
  return function Link<P extends keyof T>(inProps: LinkProps<T, P>) {
    const [routeProps, props] = splitProps(inProps, ["href", "params" as any]);
    return createComponent(
      A,
      mergeProps(props, {
        get href() {
          return routeProps.href
            ? createRouteHref(routeProps.href, routeProps.params)
            : undefined;
        },
      }) as any,
    );
  };
}

export const Link = defineLink<any>();
