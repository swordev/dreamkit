import type { JSXElement } from "solid-js";

declare function Link(props: {
  href: string;
  params?: Record<string, any>;
}): JSXElement;
