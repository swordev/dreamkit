import type { JSXElement } from "solid-js";

declare module "dreamkit/definitions" {
  function Link(props: {
    href: string;
    params?: Record<string, any>;
  }): JSXElement;
}
